"use client";

import type { MealDayStat } from "@/lib/meal-stats";
import { formatTokyo } from "@/lib/timezone";

type MealHistoryChartProps = {
  days: MealDayStat[];
  averageCalories: number;
  daysNearGoal: number;
  totalDays: number;
  dailyGoal: number;
};

export function MealHistoryChart({
  days,
  averageCalories,
  daysNearGoal,
  totalDays,
  dailyGoal,
}: MealHistoryChartProps) {
  const maxKcal = Math.max(...days.map((d) => d.totalCalories), dailyGoal, 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-muted">平均</p>
          <p className="font-bold text-emerald-nut-dark">{averageCalories} kcal</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-muted">目標付近</p>
          <p className="font-bold text-emerald-nut-dark">
            {daysNearGoal}/{totalDays} 日
          </p>
        </div>
      </div>

      <div className="relative flex items-end gap-1 h-40 px-1">
        <div
          className="absolute left-0 right-0 border-t border-dashed border-amber-400 pointer-events-none"
          style={{
            bottom: `${Math.max(8, (dailyGoal / maxKcal) * 100)}%`,
          }}
          title={`目標 ${dailyGoal} kcal`}
        />
        {days.map((day) => {
          const heightPct = Math.max(4, (day.totalCalories / maxKcal) * 100);
          const nearGoal = day.percentOfGoal >= 80 && day.percentOfGoal <= 120;
          const label = formatTokyo(
            new Date(`${day.date}T12:00:00+09:00`),
            days.length <= 7 ? "M/d" : "d"
          );
          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1 min-w-0 relative z-10"
              title={`${day.date}: ${day.totalCalories}kcal`}
            >
              <div className="w-full flex items-end justify-center h-32">
                <div
                  className={`w-full max-w-6 rounded-t-md transition-all ${
                    nearGoal ? "bg-emerald-500" : "bg-emerald-300"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-[10px] text-muted truncate w-full text-center">
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted text-center">
        破線は目標 {dailyGoal} kcal
      </p>
    </div>
  );
}
