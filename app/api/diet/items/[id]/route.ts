import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { userFoodItems } from "@/lib/db/schema";

const updateSchema = z.object({
  nameJa: z.string().min(1).max(100).optional(),
  calories: z.number().int().positive().max(10000).optional(),
  kind: z.enum(["food", "drink"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const [updated] = await db
    .update(userFoodItems)
    .set(parsed.data)
    .where(
      and(eq(userFoodItems.id, id), eq(userFoodItems.userId, authResult.userId))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const [deleted] = await db
    .delete(userFoodItems)
    .where(
      and(eq(userFoodItems.id, id), eq(userFoodItems.userId, authResult.userId))
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
