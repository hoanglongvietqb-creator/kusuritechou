import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  medications,
  medLogs,
  mealLogs,
  hydrationSettings,
} from "@/lib/db/schema";
import { todayDateStringTokyo } from "@/lib/timezone";
import { getHydrationHistory } from "@/lib/hydration-stats";

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

export async function buildPeriodSummary(
  userId: string,
  range: "week" | "month"
) {
  const dayCount = range === "week" ? 7 : 30;
  const periodEndDate = todayDateStringTokyo();
  const periodStartDate = addDaysToDateStr(periodEndDate, -(dayCount - 1));
  const { start: rangeStart } = dateBoundsTokyo(periodStartDate);
  const { end: rangeEnd } = dateBoundsTokyo(periodEndDate);

  const hydration = await getHydrationHistory(userId, range);

  const [meals, medList, medTaken, settings] = await Promise.all([
    db
      .select()
      .from(mealLogs)
      .where(
        and(
          eq(mealLogs.userId, userId),
          gte(mealLogs.loggedAt, rangeStart),
          lt(mealLogs.loggedAt, new Date(rangeEnd.getTime() + 1))
        )
      ),
    db.select().from(medications).where(eq(medications.userId, userId)),
    db
      .select()
      .from(medLogs)
      .where(
        and(
          eq(medLogs.userId, userId),
          gte(medLogs.takenAt, rangeStart),
          lt(medLogs.takenAt, new Date(rangeEnd.getTime() + 1))
        )
      ),
    db
      .select()
      .from(hydrationSettings)
      .where(eq(hydrationSettings.userId, userId))
      .limit(1),
  ]);

  const goalMl = settings[0]?.dailyGoalMl ?? 2000;

  const caloriesByDate = new Map<string, number>();
  const mealCounts = new Map<string, number>();
  for (const m of meals) {
    const d = new Date(m.loggedAt).toLocaleDateString("en-CA", {
      timeZone: "Asia/Tokyo",
    });
    caloriesByDate.set(d, (caloriesByDate.get(d) ?? 0) + m.calories);
    mealCounts.set(m.name, (mealCounts.get(m.name) ?? 0) + 1);
  }

  const topMeals = [...mealCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => `${name} (${count}回)`);

  const avgCalories =
    hydration.days.length > 0
      ? Math.round(
          [...caloriesByDate.values()].reduce((s, v) => s + v, 0) /
            hydration.days.length
        )
      : 0;

  const expectedDoses = medList.reduce(
    (s, m) => s + (m.scheduleTimes as string[]).length * dayCount,
    0
  );
  const takenCount = medTaken.length;

  const periodLabel = range === "week" ? "過去7日間" : "過去30日間";

  const text = `
期間: ${periodLabel} (${periodStartDate} 〜 ${periodEndDate}, Asia/Tokyo)

【水分（日別）】
目標: ${goalMl}ml/日
平均摂取: ${hydration.averageMl}ml/日
目標達成日数: ${hydration.daysMetGoal}/${hydration.totalDays}日
${hydration.days.map((d) => `- ${d.date}: ${d.totalMl}ml (${d.percentOfGoal}%)`).join("\n")}

【食事・カロリー】
期間平均カロリー/日: ${avgCalories}kcal
よく食べたメニュー: ${topMeals.join(", ") || "記録なし"}
総食事記録数: ${meals.length}件

【服薬】
登録薬: ${medList.length}種
期間の服用記録: ${takenCount}回
参考予定回数（概算）: ${expectedDoses}回
${medList.map((m) => `- ${m.name} (${m.dosage})`).join("\n") || "登録なし"}
`.trim();

  return {
    periodType: range,
    periodEndDate,
    text,
    hydration,
    avgCalories,
    mealCount: meals.length,
  };
}
