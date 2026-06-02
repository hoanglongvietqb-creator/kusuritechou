import { NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { mealLogs } from "@/lib/db/schema";

function getTodayBounds() {
  const dateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tokyo",
  });
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59.999+09:00`);
  return { start, end };
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  calories: z.number().int().positive().max(10000).optional(),
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

  const { start, end } = getTodayBounds();

  const [updated] = await db
    .update(mealLogs)
    .set(parsed.data)
    .where(
      and(
        eq(mealLogs.id, id),
        eq(mealLogs.userId, authResult.userId),
        gte(mealLogs.loggedAt, start),
        lt(mealLogs.loggedAt, end)
      )
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
  const { start, end } = getTodayBounds();

  const [deleted] = await db
    .delete(mealLogs)
    .where(
      and(
        eq(mealLogs.id, id),
        eq(mealLogs.userId, authResult.userId),
        gte(mealLogs.loggedAt, start),
        lt(mealLogs.loggedAt, end)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
