import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { medications } from "@/lib/db/schema";

const medSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  scheduleTimes: z.array(z.string()).min(1),
  foodTiming: z.enum(["before_meal", "after_meal", "empty_stomach", "any"]),
  contraindications: z.string().optional(),
});

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const list = await db
    .select()
    .from(medications)
    .where(eq(medications.userId, authResult.userId));

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = medSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const [created] = await db
    .insert(medications)
    .values({ ...parsed.data, userId: authResult.userId })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
