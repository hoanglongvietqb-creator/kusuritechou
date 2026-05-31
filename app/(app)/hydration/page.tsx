"use client";

import { useCallback, useEffect, useState } from "react";
import { WaterGlass } from "@/components/hydration/WaterGlass";
import { QuickAddButtons } from "@/components/hydration/QuickAddButtons";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTokyo } from "@/lib/timezone";

type HydrationData = {
  dailyGoalMl: number;
  totalMl: number;
  logs: { id: string; amountMl: number; loggedAt: string }[];
};

export default function HydrationPage() {
  const [data, setData] = useState<HydrationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [goalInput, setGoalInput] = useState("2000");
  const [showGoalEdit, setShowGoalEdit] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/hydration");
    const json = await res.json();
    setData(json);
    setGoalInput(String(json.dailyGoalMl));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addWater(amountMl: number) {
    setLoading(true);
    await fetch("/api/hydration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl }),
    });
    await load();
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
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-water-dark">水分記録</h1>
        <button
          type="button"
          className="text-sm text-water-dark underline"
          onClick={() => setShowGoalEdit(!showGoalEdit)}
        >
          目標変更
        </button>
      </div>

      {showGoalEdit && (
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
    </div>
  );
}
