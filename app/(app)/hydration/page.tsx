"use client";

import { useCallback, useEffect, useState } from "react";
import { WaterGlass } from "@/components/hydration/WaterGlass";
import { QuickAddButtons } from "@/components/hydration/QuickAddButtons";
import { HydrationHistoryChart } from "@/components/hydration/HydrationHistoryChart";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTokyo } from "@/lib/timezone";
import type { HydrationHistoryResult } from "@/lib/hydration-stats";

type HydrationData = {
  dailyGoalMl: number;
  totalMl: number;
  logs: { id: string; amountMl: number; loggedAt: string }[];
};

type Tab = "today" | "week" | "month";

export default function HydrationPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [data, setData] = useState<HydrationData | null>(null);
  const [history, setHistory] = useState<HydrationHistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [goalInput, setGoalInput] = useState("2000");
  const [showGoalEdit, setShowGoalEdit] = useState(false);

  const loadToday = useCallback(async () => {
    const res = await fetch("/api/hydration");
    const json = await res.json();
    setData(json);
    setGoalInput(String(json.dailyGoalMl));
  }, []);

  const loadHistory = useCallback(async (range: "week" | "month") => {
    const res = await fetch(`/api/hydration/history?range=${range}`);
    setHistory(await res.json());
  }, []);

  useEffect(() => {
    if (tab === "today") {
      loadToday();
    } else {
      loadHistory(tab);
    }
  }, [tab, loadToday, loadHistory]);

  async function addWater(amountMl: number) {
    setLoading(true);
    await fetch("/api/hydration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl }),
    });
    if (tab === "today") {
      await loadToday();
    } else {
      await loadHistory(tab);
      await loadToday();
    }
    setLoading(false);
  }

  async function saveGoal() {
    const dailyGoalMl = parseInt(goalInput, 10);
    if (!dailyGoalMl) return;
    await fetch("/api/hydration", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyGoalMl }),
    });
    setShowGoalEdit(false);
    if (tab === "today") loadToday();
    else loadHistory(tab);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-water-dark">水分記録</h1>
        {tab === "today" && (
          <button
            type="button"
            className="text-sm text-water-dark underline"
            onClick={() => setShowGoalEdit(!showGoalEdit)}
          >
            目標変更
          </button>
        )}
      </div>

      <div className="flex gap-2 rounded-xl bg-sky-100 p-1">
        {(
          [
            ["today", "今日"],
            ["week", "週間"],
            ["month", "月間"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white text-water-dark shadow-sm"
                : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showGoalEdit && tab === "today" && (
        <Card className="flex gap-2 items-end p-3">
          <div className="flex-1">
            <label className="text-xs text-muted">1日の目標 (ml)</label>
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
            />
          </div>
          <Button variant="water" size="sm" onClick={saveGoal}>
            保存
          </Button>
        </Card>
      )}

      {tab === "today" ? (
        <>
          <WaterGlass
            currentMl={data?.totalMl ?? 0}
            goalMl={data?.dailyGoalMl ?? 2000}
            className="py-4"
          />
          <QuickAddButtons onAdd={addWater} loading={loading} />
          <section>
            <h2 className="font-semibold text-sm mb-2">本日の記録</h2>
            {!data?.logs.length ? (
              <p className="text-sm text-muted">まだ記録がありません</p>
            ) : (
              <ul className="space-y-2">
                {data.logs.map((log) => (
                  <li
                    key={log.id}
                    className="flex justify-between text-sm bg-sky-50 rounded-xl px-3 py-2"
                  >
                    <span>+{log.amountMl} ml</span>
                    <span className="text-muted">
                      {formatTokyo(new Date(log.loggedAt), "HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : history ? (
        <Card className="p-4 border-sky-200">
          <HydrationHistoryChart
            days={history.days}
            averageMl={history.averageMl}
            daysMetGoal={history.daysMetGoal}
            totalDays={history.totalDays}
          />
          <p className="text-xs text-muted mt-4 text-center">
            記録を追加するとグラフに反映されます
          </p>
        </Card>
      ) : (
        <p className="text-sm text-muted text-center">読み込み中...</p>
      )}
    </div>
  );
}
