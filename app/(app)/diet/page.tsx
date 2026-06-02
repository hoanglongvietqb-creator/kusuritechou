"use client";

import { useCallback, useEffect, useState } from "react";
import { FoodPresetGrid, type FoodPreset } from "@/components/diet/FoodPresetGrid";
import { CustomFoodForm } from "@/components/diet/CustomFoodForm";
import {
  UserFoodItemList,
  type UserFoodItem,
} from "@/components/diet/UserFoodItemList";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTokyo } from "@/lib/timezone";

type MealLog = {
  id: string;
  name: string;
  calories: number;
  loggedAt: string;
};

export default function DietPage() {
  const [presets, setPresets] = useState<FoodPreset[]>([]);
  const [customItems, setCustomItems] = useState<UserFoodItem[]>([]);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCalories, setEditCalories] = useState("");

  const load = useCallback(async () => {
    const [presetsRes, dietRes, itemsRes] = await Promise.all([
      fetch("/api/diet/presets"),
      fetch("/api/diet"),
      fetch("/api/diet/items"),
    ]);
    setPresets(await presetsRes.json());
    const diet = await dietRes.json();
    setLogs(diet.logs);
    setTotalCalories(diet.totalCalories);
    setCustomItems(await itemsRes.json());
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
        presetId: preset.isCustom ? undefined : preset.id,
        userFoodItemId: preset.isCustom ? preset.id : undefined,
      }),
    });
    await load();
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
    load();
  }

  async function deleteLog(id: string) {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/diet/logs/${id}`, { method: "DELETE" });
    load();
  }

  const globalPresets = presets.filter((p) => !p.isCustom);
  const customPresets = presets.filter((p) => p.isCustom);

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

      <CustomFoodForm onCreated={load} />

      {customItems.length > 0 && (
        <UserFoodItemList items={customItems} onChanged={load} />
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
    </div>
  );
}
