import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { hydrationLogs, hydrationSettings } from "@/lib/db/schema";
import { todayDateStringTokyo } from "@/lib/timezone";

export type HydrationDayStat = {
  date: string;
  totalMl: number;
  goalMl: number;
  percentOfGoal: number;
};

export type HydrationHistoryResult = {
  range: "week" | "month";
  days: HydrationDayStat[];
  averageMl: number;
  daysMetGoal: number;
  totalDays: number;
};

function dateBoundsTokyo(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59.999+09:00`);
  return { start, end };
}

function addDaysToDateStr(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + delta));
  return utc.toISOString().slice(0, 10);
}

export async function getHydrationHistory(
  userId: string,
  range: "week" | "month"
): Promise<HydrationHistoryResult> {
  const dayCount = range === "week" ? 7 : 30;
  const endDateStr = todayDateStringTokyo();
  const startDateStr = addDaysToDateStr(endDateStr, -(dayCount - 1));

  const { start: rangeStart } = dateBoundsTokyo(startDateStr);
  const { end: rangeEnd } = dateBoundsTokyo(endDateStr);

  const [settingsRow] = await db
    .select()
    .from(hydrationSettings)
    .where(eq(hydrationSettings.userId, userId))
    .limit(1);

  const goalMl = settingsRow?.dailyGoalMl ?? 2000;

  const logs = await db
    .select()
    .from(hydrationLogs)
    .where(
      and(
        eq(hydrationLogs.userId, userId),
        gte(hydrationLogs.loggedAt, rangeStart),
        lt(hydrationLogs.loggedAt, new Date(rangeEnd.getTime() + 1))
      )
    );

  const totalsByDate = new Map<string, number>();
  for (const log of logs) {
    const dateStr = new Date(log.loggedAt).toLocaleDateString("en-CA", {
      timeZone: "Asia/Tokyo",
    });
    totalsByDate.set(dateStr, (totalsByDate.get(dateStr) ?? 0) + log.amountMl);
  }

  const days: HydrationDayStat[] = [];
  for (let i = 0; i < dayCount; i++) {
    const dateStr = addDaysToDateStr(startDateStr, i);
    const totalMl = totalsByDate.get(dateStr) ?? 0;
    const percentOfGoal = goalMl > 0 ? Math.round((totalMl / goalMl) * 100) : 0;
    days.push({ date: dateStr, totalMl, goalMl, percentOfGoal });
  }

  const averageMl =
    days.length > 0
      ? Math.round(days.reduce((s, d) => s + d.totalMl, 0) / days.length)
      : 0;
  const daysMetGoal = days.filter((d) => d.totalMl >= d.goalMl).length;

  return {
    range,
    days,
    averageMl,
    daysMetGoal,
    totalDays: days.length,
  };
}
