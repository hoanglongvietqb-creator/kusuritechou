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

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { start, end } = getTodayBounds();

  const logs = await db
    .select()
    .from(mealLogs)
    .where(
      and(
        eq(mealLogs.userId, authResult.userId),
        gte(mealLogs.loggedAt, start),
        lt(mealLogs.loggedAt, end)
      )
    )
    .orderBy(mealLogs.loggedAt);

  const totalCalories = logs.reduce((s, l) => s + l.calories, 0);

  return NextResponse.json({ logs, totalCalories });
}

const logSchema = z.object({
  name: z.string().min(1),
  calories: z.number().int().positive(),
  presetId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const [log] = await db
    .insert(mealLogs)
    .values({
      userId: authResult.userId,
      name: parsed.data.name,
      calories: parsed.data.calories,
      presetId: parsed.data.presetId,
      loggedAt: new Date(),
    })
    .returning();

  return NextResponse.json(log, { status: 201 });
}
