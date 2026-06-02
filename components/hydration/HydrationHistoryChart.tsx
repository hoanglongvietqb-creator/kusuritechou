"use client";

import type { HydrationDayStat } from "@/lib/hydration-stats";
import { formatTokyo } from "@/lib/timezone";

type HydrationHistoryChartProps = {
  days: HydrationDayStat[];
  averageMl: number;
  daysMetGoal: number;
  totalDays: number;
};

export function HydrationHistoryChart({
  days,
  averageMl,
  daysMetGoal,
  totalDays,
}: HydrationHistoryChartProps) {
  const maxMl = Math.max(...days.map((d) => d.totalMl), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-sky-50 rounded-xl p-3 text-center">
          <p className="text-muted">平均</p>
          <p className="font-bold text-sky-800">{averageMl} ml</p>
        </div>
        <div className="bg-sky-50 rounded-xl p-3 text-center">
          <p className="text-muted">目標達成</p>
          <p className="font-bold text-sky-800">
            {daysMetGoal}/{totalDays} 日
          </p>
        </div>
      </div>

      <div className="flex items-end gap-1 h-36 px-1">
        {days.map((day) => {
          const heightPct = Math.max(4, (day.totalMl / maxMl) * 100);
          const met = day.totalMl >= day.goalMl;
          const label = formatTokyo(
            new Date(`${day.date}T12:00:00+09:00`),
            days.length <= 7 ? "M/d" : "d"
          );
          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1 min-w-0"
              title={`${day.date}: ${day.totalMl}ml`}
            >
              <div className="w-full flex items-end justify-center h-28">
                <div
                  className={`w-full max-w-6 rounded-t-md transition-all ${
                    met ? "bg-sky-500" : "bg-sky-300"
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
    </div>
  );
}
