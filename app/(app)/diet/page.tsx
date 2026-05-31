"use client";

import { useCallback, useEffect, useState } from "react";
import { FoodPresetGrid, type FoodPreset } from "@/components/diet/FoodPresetGrid";
import { Card } from "@/components/ui/card";
import { formatTokyo } from "@/lib/timezone";

type MealLog = {
  id: string;
  name: string;
  calories: number;
  loggedAt: string;
};

export default function DietPage() {
  const [presets, setPresets] = useState<FoodPreset[]>([]);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [presetsRes, dietRes] = await Promise.all([
      fetch("/api/diet/presets"),
      fetch("/api/diet"),
    ]);
    setPresets(await presetsRes.json());
    const diet = await dietRes.json();
    setLogs(diet.logs);
    setTotalCalories(diet.totalCalories);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addMeal(preset: FoodPreset) {
    setLoading(true);
    await fetch("/api/diet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: preset.nameJa,
        calories: preset.calories,
        presetId: preset.id,
      }),
    });
    await load();
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-emerald-nut-dark">食事・カロリー</h1>
        <Card className="mt-3 p-4 text-center border-emerald-nut/30">
          <p className="text-sm text-muted">本日の合計</p>
          <p className="text-3xl font-bold text-emerald-nut-dark">
            {totalCalories} <span className="text-lg font-normal">kcal</span>
          </p>
        </Card>
      </header>

      <section>
        <h2 className="font-semibold text-sm mb-3">クイック追加（ベトナム料理）</h2>
        <FoodPresetGrid presets={presets} onSelect={addMeal} loading={loading} />
      </section>

      <section>
        <h2 className="font-semibold text-sm mb-2">本日の記録</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted">まだ記録がありません</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex justify-between text-sm bg-emerald-50 rounded-xl px-3 py-2"
              >
                <span>{log.name}</span>
                <span>
                  {log.calories} kcal ·{" "}
                  <span className="text-muted">
                    {formatTokyo(new Date(log.loggedAt), "HH:mm")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
