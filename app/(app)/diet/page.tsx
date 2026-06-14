"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FoodPresetGrid, type FoodPreset } from "@/components/diet/FoodPresetGrid";
import { CustomFoodForm } from "@/components/diet/CustomFoodForm";
import { MealPhotoCapture } from "@/components/diet/MealPhotoCapture";
import { MealHistoryChart } from "@/components/diet/MealHistoryChart";
import { CalorieAdviceCard } from "@/components/diet/CalorieAdviceCard";
import {
  UserFoodItemList,
  type UserFoodItem,
} from "@/components/diet/UserFoodItemList";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTokyo } from "@/lib/timezone";
import type { MealHistoryResult } from "@/lib/meal-stats";

type MealLog = {
  id: string;
  name: string;
  calories: number;
  loggedAt: string;
  source?: string;
};

type Tab = "today" | "week" | "month";

export default function DietPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [presets, setPresets] = useState<FoodPreset[]>([]);
  const [customItems, setCustomItems] = useState<UserFoodItem[]>([]);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2000);
  const [hasProfile, setHasProfile] = useState(false);
  const [history, setHistory] = useState<MealHistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCalories, setEditCalories] = useState("");

  const loadToday = useCallback(async () => {
    const [presetsRes, dietRes, itemsRes] = await Promise.all([
      fetch("/api/diet/presets"),
      fetch("/api/diet"),
      fetch("/api/diet/items"),
    ]);
    setPresets(await presetsRes.json());
    const diet = await dietRes.json();
    setLogs(diet.logs);
    setTotalCalories(diet.totalCalories);
    setDailyCalorieGoal(diet.dailyCalorieGoal ?? 2000);
    setHasProfile(diet.hasProfile ?? false);
    setCustomItems(await itemsRes.json());
  }, []);

  const loadHistory = useCallback(async (range: "week" | "month") => {
    const res = await fetch(`/api/diet/history?range=${range}`);
    setHistory(await res.json());
  }, []);

  useEffect(() => {
    if (tab === "today") {
      loadToday();
    } else {
      loadHistory(tab);
    }
  }, [tab, loadToday, loadHistory]);

  async function refresh() {
    if (tab === "today") {
      await loadToday();
    } else {
      await loadHistory(tab);
      await loadToday();
    }
  }

  async function addMeal(preset: FoodPreset) {
    setLoading(true);
    await fetch("/api/diet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: preset.nameJa,
        calories: preset.calories,
        presetId: preset.isCustom ? undefined : preset.id,
        userFoodItemId: preset.isCustom ? preset.id : undefined,
        source: "preset",
      }),
    });
    await refresh();
    setLoading(false);
  }

  function startEditLog(log: MealLog) {
    setEditingLogId(log.id);
    setEditName(log.name);
    setEditCalories(String(log.calories));
  }

  async function saveEditLog(id: string) {
    const kcal = parseInt(editCalories, 10);
    if (!editName.trim() || !kcal) return;
    await fetch(`/api/diet/logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), calories: kcal }),
    });
    setEditingLogId(null);
    refresh();
  }

  async function deleteLog(id: string) {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/diet/logs/${id}`, { method: "DELETE" });
    refresh();
  }

  const globalPresets = presets.filter((p) => !p.isCustom);
  const customPresets = presets.filter((p) => p.isCustom);
  const percentOfGoal =
    dailyCalorieGoal > 0 ? Math.round((totalCalories / dailyCalorieGoal) * 100) : 0;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-emerald-nut-dark">食事・カロリー</h1>
          <div className="flex gap-3 text-xs">
            <Link href="/diet/profile" className="text-emerald-nut-dark underline">
              栄養プロフィール
            </Link>
            <Link href="/nutrition" className="text-emerald-nut-dark underline">
              栄養の知識
            </Link>
          </div>
        </div>
      </header>

      <div className="flex gap-2 rounded-xl bg-emerald-50 p-1">
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
                ? "bg-white text-emerald-nut-dark shadow-sm"
                : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <>
          <Card className="p-4 text-center border-emerald-nut/30">
            <p className="text-sm text-muted">本日の合計</p>
            <p className="text-3xl font-bold text-emerald-nut-dark">
              {totalCalories}{" "}
              <span className="text-lg font-normal">/ {dailyCalorieGoal} kcal</span>
            </p>
            <p className="text-xs text-muted mt-1">目標の {percentOfGoal}%</p>
          </Card>

          <CalorieAdviceCard
            hasProfile={hasProfile}
            todayKcal={totalCalories}
            dailyGoal={dailyCalorieGoal}
          />

          <MealPhotoCapture onLogged={refresh} disabled={loading} />

          <CustomFoodForm onCreated={refresh} />

          {customItems.length > 0 && (
            <UserFoodItemList items={customItems} onChanged={refresh} />
          )}

          {customPresets.length > 0 && (
            <section>
              <h2 className="font-semibold text-sm mb-3">マイメニュー（クイック追加）</h2>
              <FoodPresetGrid presets={customPresets} onSelect={addMeal} loading={loading} />
            </section>
          )}

          <section>
            <h2 className="font-semibold text-sm mb-3">クイック追加（ベトナム料理）</h2>
            <FoodPresetGrid presets={globalPresets} onSelect={addMeal} loading={loading} />
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
                    className="text-sm bg-emerald-50 rounded-xl px-3 py-2"
                  >
                    {editingLogId === log.id ? (
                      <div className="space-y-2">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        <Input
                          type="number"
                          value={editCalories}
                          onChange={(e) => setEditCalories(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="emerald" onClick={() => saveEditLog(log.id)}>
                            保存
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingLogId(null)}>
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-2">
                        <span>
                          {log.name}
                          {log.source === "photo" && (
                            <span className="text-[10px] text-muted ml-1">📷</span>
                          )}
                          <br />
                          <span className="text-emerald-nut-dark">{log.calories} kcal</span>
                          <span className="text-muted ml-2">
                            {formatTokyo(new Date(log.loggedAt), "HH:mm")}
                          </span>
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => startEditLog(log)}>
                            編集
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteLog(log.id)}>
                            削除
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : history ? (
        <MealHistoryChart
          days={history.days}
          averageCalories={history.averageCalories}
          daysNearGoal={history.daysNearGoal}
          totalDays={history.totalDays}
          dailyGoal={history.dailyGoal}
        />
      ) : (
        <p className="text-sm text-muted">読み込み中...</p>
      )}
    </div>
  );
}
