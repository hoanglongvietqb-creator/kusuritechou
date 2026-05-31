import { NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { hydrationLogs, hydrationSettings } from "@/lib/db/schema";

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

  const [settingsRow] = await db
    .select()
    .from(hydrationSettings)
    .where(eq(hydrationSettings.userId, authResult.userId))
    .limit(1);

  let dailyGoalMl = settingsRow?.dailyGoalMl ?? 2000;
  if (!settingsRow) {
    await db.insert(hydrationSettings).values({
      userId: authResult.userId,
      dailyGoalMl: 2000,
    });
  }

  const logs = await db
    .select()
    .from(hydrationLogs)
    .where(
      and(
        eq(hydrationLogs.userId, authResult.userId),
        gte(hydrationLogs.loggedAt, start),
        lt(hydrationLogs.loggedAt, end)
      )
    )
    .orderBy(hydrationLogs.loggedAt);

  const totalMl = logs.reduce((s, l) => s + l.amountMl, 0);

  return NextResponse.json({ dailyGoalMl, totalMl, logs });
}

const logSchema = z.object({
  amountMl: z.number().int().positive(),
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
    .insert(hydrationLogs)
    .values({
      userId: authResult.userId,
      amountMl: parsed.data.amountMl,
      loggedAt: new Date(),
    })
    .returning();

  return NextResponse.json(log, { status: 201 });
}

const settingsSchema = z.object({
  dailyGoalMl: z.number().int().min(500).max(10000),
});

export async function PATCH(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(hydrationSettings)
    .where(eq(hydrationSettings.userId, authResult.userId))
    .limit(1);

  if (existing.length === 0) {
    const [created] = await db
      .insert(hydrationSettings)
      .values({
        userId: authResult.userId,
        dailyGoalMl: parsed.data.dailyGoalMl,
      })
      .returning();
    return NextResponse.json(created);
  }

  const [updated] = await db
    .update(hydrationSettings)
    .set({
      dailyGoalMl: parsed.data.dailyGoalMl,
      updatedAt: new Date(),
    })
    .where(eq(hydrationSettings.userId, authResult.userId))
    .returning();

  return NextResponse.json(updated);
}
