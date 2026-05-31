import { NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  medications,
  medLogs,
  hydrationLogs,
  hydrationSettings,
  mealLogs,
} from "@/lib/db/schema";
import {
  DAY_PERIOD_LABELS,
  formatTokyo,
  getPeriodFromTimeString,
  todayDateStringTokyo,
  type DayPeriod,
} from "@/lib/timezone";
import { FOOD_TIMING_LABEL } from "@/lib/constants";

function getTodayBounds() {
  const dateStr = todayDateStringTokyo();
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59.999+09:00`);
  return { start, end, dateStr };
}

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { start, end, dateStr } = getTodayBounds();

  const [meds, logs, waterLogs, meals, settings] = await Promise.all([
    db.select().from(medications).where(eq(medications.userId, authResult.userId)),
    db
      .select()
      .from(medLogs)
      .where(
        and(
          eq(medLogs.userId, authResult.userId),
          gte(medLogs.takenAt, start),
          lt(medLogs.takenAt, end)
        )
      ),
    db
      .select()
      .from(hydrationLogs)
      .where(
        and(
          eq(hydrationLogs.userId, authResult.userId),
          gte(hydrationLogs.loggedAt, start),
          lt(hydrationLogs.loggedAt, end)
        )
      ),
    db
      .select()
      .from(mealLogs)
      .where(
        and(
          eq(mealLogs.userId, authResult.userId),
          gte(mealLogs.loggedAt, start),
          lt(mealLogs.loggedAt, end)
        )
      ),
    db
      .select()
      .from(hydrationSettings)
      .where(eq(hydrationSettings.userId, authResult.userId))
      .limit(1),
  ]);

  const goalMl = settings[0]?.dailyGoalMl ?? 2000;
  const totalWater = waterLogs.reduce((s, l) => s + l.amountMl, 0);
  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);

  type ScheduleItem = {
    type: "medication" | "meal" | "hydration";
    time: string;
    period: DayPeriod;
    title: string;
    subtitle?: string;
    status: "done" | "pending" | "overdue";
    id?: string;
    medicationId?: string;
  };

  const now = new Date();
  const nowMinutes =
    parseInt(formatTokyo(now, "H"), 10) * 60 +
    parseInt(formatTokyo(now, "m"), 10);

  const items: ScheduleItem[] = [];

  for (const med of meds) {
    for (const time of med.scheduleTimes as string[]) {
      const [h, m] = time.split(":").map(Number);
      const slotMinutes = h * 60 + (m ?? 0);
      const taken = logs.some(
        (l) =>
          l.medicationId === med.id &&
          formatTokyo(l.takenAt, "HH:mm") ===
            formatTokyo(
              new Date(`${dateStr}T${time}:00+09:00`),
              "HH:mm"
            )
      );
      const takenAny = logs.some((l) => l.medicationId === med.id);
      let status: ScheduleItem["status"] = "pending";
      if (taken || (takenAny && logs.find((l) => l.medicationId === med.id))) {
        const lastLog = logs
          .filter((l) => l.medicationId === med.id)
          .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())[0];
        if (lastLog) {
          status = "done";
        }
      }
      if (!takenAny && slotMinutes < nowMinutes - 30) status = "overdue";
      else if (takenAny) status = "done";

      items.push({
        type: "medication",
        time,
        period: getPeriodFromTimeString(time),
        title: med.name,
        subtitle: `${med.dosage} · ${FOOD_TIMING_LABEL[med.foodTiming]}`,
        status,
        medicationId: med.id,
      });
    }
  }

  for (const meal of meals) {
    items.push({
      type: "meal",
      time: formatTokyo(meal.loggedAt, "HH:mm"),
      period: getPeriodFromTimeString(formatTokyo(meal.loggedAt, "HH:mm")),
      title: meal.name,
      subtitle: `${meal.calories} kcal`,
      status: "done",
      id: meal.id,
    });
  }

  items.sort((a, b) => a.time.localeCompare(b.time));

  const byPeriod = (["morning", "afternoon", "evening", "night"] as DayPeriod[]).map(
    (period) => ({
      period,
      label: DAY_PERIOD_LABELS[period],
      items: items.filter((i) => i.period === period),
    })
  );

  return NextResponse.json({
    date: dateStr,
    summary: { totalWater, goalMl, totalCalories, medCount: meds.length },
    timeline: byPeriod,
    recentWater: waterLogs.slice(-3).reverse(),
  });
}
