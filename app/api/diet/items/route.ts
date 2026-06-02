import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { userFoodItems } from "@/lib/db/schema";

const createSchema = z.object({
  nameJa: z.string().min(1).max(100),
  calories: z.number().int().positive().max(10000),
  kind: z.enum(["food", "drink"]).default("food"),
});

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const items = await db
    .select()
    .from(userFoodItems)
    .where(eq(userFoodItems.userId, authResult.userId))
    .orderBy(userFoodItems.nameJa);

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const [item] = await db
    .insert(userFoodItems)
    .values({
      userId: authResult.userId,
      nameJa: parsed.data.nameJa,
      calories: parsed.data.calories,
      kind: parsed.data.kind,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
