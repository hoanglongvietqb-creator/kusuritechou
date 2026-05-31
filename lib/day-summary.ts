import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  medications,
  medLogs,
  hydrationLogs,
  mealLogs,
  hydrationSettings,
} from "@/lib/db/schema";
import { todayDateStringTokyo, formatTokyo } from "@/lib/timezone";

function getTodayBounds() {
  const dateStr = todayDateStringTokyo();
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59.999+09:00`);
  return { start, end, dateStr };
}

const FOOD_TIMING_LABELS: Record<string, string> = {
  before_meal: "食前",
  after_meal: "食後",
  empty_stomach: "空腹時",
  any: "指定なし",
};

export async function buildDaySummary(userId: string) {
  const { start, end, dateStr } = getTodayBounds();

  const [meds, logs, meals, waterLogs, settings] = await Promise.all([
    db.select().from(medications).where(eq(medications.userId, userId)),
    db
      .select()
      .from(medLogs)
      .where(
        and(
          eq(medLogs.userId, userId),
          gte(medLogs.takenAt, start),
          lt(medLogs.takenAt, end)
        )
      ),
    db
      .select()
      .from(mealLogs)
      .where(
        and(
          eq(mealLogs.userId, userId),
          gte(mealLogs.loggedAt, start),
          lt(mealLogs.loggedAt, end)
        )
      ),
    db
      .select()
      .from(hydrationLogs)
      .where(
        and(
          eq(hydrationLogs.userId, userId),
          gte(hydrationLogs.loggedAt, start),
          lt(hydrationLogs.loggedAt, end)
        )
      ),
    db
      .select()
      .from(hydrationSettings)
      .where(eq(hydrationSettings.userId, userId))
      .limit(1),
  ]);

  const goalMl = settings[0]?.dailyGoalMl ?? 2000;
  const totalWater = waterLogs.reduce((s, l) => s + l.amountMl, 0);
  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);

  const text = `
日付: ${dateStr} (Asia/Tokyo)

【服薬】
${meds
  .map((m) => {
    const taken = logs
      .filter((l) => l.medicationId === m.id)
      .map((l) => formatTokyo(l.takenAt, "HH:mm"))
      .join(", ");
    return `- ${m.name} (${m.dosage}) 予定: ${(m.scheduleTimes as string[]).join(", ")} / 食事: ${FOOD_TIMING_LABELS[m.foodTiming] ?? m.foodTiming}${m.contraindications ? ` / 注意: ${m.contraindications}` : ""} / 本日服用: ${taken || "未記録"}`;
  })
  .join("\n") || "登録なし"}

【水分】
目標: ${goalMl}ml / 摂取: ${totalWater}ml

【食事】
合計カロリー: ${totalCalories}kcal
${meals.map((m) => `- ${m.name}: ${m.calories}kcal (${formatTokyo(m.loggedAt, "HH:mm")})`).join("\n") || "記録なし"}
`.trim();

  return {
    dateStr,
    text,
    totalWater,
    goalMl,
    totalCalories,
    medicationCount: meds.length,
  };
}
