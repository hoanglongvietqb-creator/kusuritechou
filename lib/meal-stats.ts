import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { mealLogs, userNutritionProfiles } from "@/lib/db/schema";
import { todayDateStringTokyo } from "@/lib/timezone";

export type MealDayStat = {
  date: string;
  totalCalories: number;
  goalCalories: number;
  mealCount: number;
  percentOfGoal: number;
};

export type MealHistoryResult = {
  range: "week" | "month";
  days: MealDayStat[];
  averageCalories: number;
  daysNearGoal: number;
  totalDays: number;
  dailyGoal: number;
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

export async function getUserDailyCalorieGoal(userId: string): Promise<number> {
  const [profile] = await db
    .select({ dailyCalorieGoal: userNutritionProfiles.dailyCalorieGoal })
    .from(userNutritionProfiles)
    .where(eq(userNutritionProfiles.userId, userId))
    .limit(1);
  return profile?.dailyCalorieGoal ?? 2000;
}

export async function getMealHistory(
  userId: string,
  range: "week" | "month"
): Promise<MealHistoryResult> {
  const dayCount = range === "week" ? 7 : 30;
  const endDateStr = todayDateStringTokyo();
  const startDateStr = addDaysToDateStr(endDateStr, -(dayCount - 1));
  const { start: rangeStart } = dateBoundsTokyo(startDateStr);
  const { end: rangeEnd } = dateBoundsTokyo(endDateStr);

  const dailyGoal = await getUserDailyCalorieGoal(userId);

  const logs = await db
    .select()
    .from(mealLogs)
    .where(
      and(
        eq(mealLogs.userId, userId),
        gte(mealLogs.loggedAt, rangeStart),
        lt(mealLogs.loggedAt, new Date(rangeEnd.getTime() + 1))
      )
    );

  const totalsByDate = new Map<string, { calories: number; count: number }>();
  for (const log of logs) {
    const dateStr = new Date(log.loggedAt).toLocaleDateString("en-CA", {
      timeZone: "Asia/Tokyo",
    });
    const cur = totalsByDate.get(dateStr) ?? { calories: 0, count: 0 };
    cur.calories += log.calories;
    cur.count += 1;
    totalsByDate.set(dateStr, cur);
  }

  const days: MealDayStat[] = [];
  for (let i = 0; i < dayCount; i++) {
    const dateStr = addDaysToDateStr(startDateStr, i);
    const entry = totalsByDate.get(dateStr) ?? { calories: 0, count: 0 };
    const percentOfGoal =
      dailyGoal > 0 ? Math.round((entry.calories / dailyGoal) * 100) : 0;
    days.push({
      date: dateStr,
      totalCalories: entry.calories,
      goalCalories: dailyGoal,
      mealCount: entry.count,
      percentOfGoal,
    });
  }

  const averageCalories =
    days.length > 0
      ? Math.round(days.reduce((s, d) => s + d.totalCalories, 0) / days.length)
      : 0;
  const daysNearGoal = days.filter(
    (d) => d.percentOfGoal >= 80 && d.percentOfGoal <= 120
  ).length;

  return {
    range,
    days,
    averageCalories,
    daysNearGoal,
    totalDays: days.length,
    dailyGoal,
  };
}
