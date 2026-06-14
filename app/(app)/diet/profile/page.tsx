"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  computeDailyCalorieGoal,
} from "@/lib/tdee";
import type { ActivityLevel, Gender, GoalType } from "@/lib/db/schema";

type ProfileForm = {
  gender: Gender;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
};

const defaultForm: ProfileForm = {
  gender: "other",
  birthYear: 1990,
  heightCm: 170,
  weightKg: 65,
  activityLevel: "sedentary",
  goalType: "maintain",
};

export default function DietProfilePage() {
  const [form, setForm] = useState<ProfileForm>(defaultForm);
  const [savedGoal, setSavedGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const previewGoal = computeDailyCalorieGoal(form);

  const load = useCallback(async () => {
    const res = await fetch("/api/diet/profile");
    const data = await res.json();
    if (data.profile) {
      setForm({
        gender: data.profile.gender,
        birthYear: data.profile.birthYear,
        heightCm: data.profile.heightCm,
        weightKg: data.profile.weightKg,
        activityLevel: data.profile.activityLevel,
        goalType: data.profile.goalType,
      });
      setSavedGoal(data.profile.dailyCalorieGoal);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/diet/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "保存に失敗しました");
    } else {
      setSavedGoal(data.dailyCalorieGoal);
      setMessage("保存しました");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-muted">読み込み中...</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/diet" className="text-sm text-emerald-nut-dark underline">
          ← 食事記録へ
        </Link>
        <h1 className="text-2xl font-bold text-emerald-nut-dark mt-2">
          栄養プロフィール
        </h1>
        <p className="text-sm text-muted mt-1">
          身長・体重・活動量から1日の目標カロリー（TDEE推定）を計算します。
        </p>
      </header>

      <Card className="p-4 space-y-4">
        <div>
          <label className="text-xs text-muted">性別</label>
          <select
            className="w-full mt-1 rounded-xl border px-3 py-2 text-sm"
            value={form.gender}
            onChange={(e) =>
              setForm((f) => ({ ...f, gender: e.target.value as Gender }))
            }
          >
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他 / 未指定</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-muted">生まれ年</label>
          <Input
            type="number"
            value={form.birthYear}
            onChange={(e) =>
              setForm((f) => ({ ...f, birthYear: parseInt(e.target.value, 10) || 1990 }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted">身長 (cm)</label>
            <Input
              type="number"
              value={form.heightCm}
              onChange={(e) =>
                setForm((f) => ({ ...f, heightCm: parseInt(e.target.value, 10) || 170 }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted">体重 (kg)</label>
            <Input
              type="number"
              value={form.weightKg}
              onChange={(e) =>
                setForm((f) => ({ ...f, weightKg: parseInt(e.target.value, 10) || 65 }))
              }
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted">活動レベル</label>
          <select
            className="w-full mt-1 rounded-xl border px-3 py-2 text-sm"
            value={form.activityLevel}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                activityLevel: e.target.value as ActivityLevel,
              }))
            }
          >
            {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
          <p className="text-[10px] text-muted mt-1">
            デスクワーク中心の方は「ほぼ座り仕事」を選ぶと目安に近くなります。
          </p>
        </div>

        <div>
          <label className="text-xs text-muted">目標</label>
          <select
            className="w-full mt-1 rounded-xl border px-3 py-2 text-sm"
            value={form.goalType}
            onChange={(e) =>
              setForm((f) => ({ ...f, goalType: e.target.value as GoalType }))
            }
          >
            {(Object.entries(GOAL_LABELS) as [GoalType, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        <Card className="p-3 bg-emerald-50 text-center border-emerald-nut/20">
          <p className="text-xs text-muted">推定1日カロリー（保存時に反映）</p>
          <p className="text-2xl font-bold text-emerald-nut-dark">
            {previewGoal} <span className="text-base font-normal">kcal</span>
          </p>
          {savedGoal !== null && savedGoal !== previewGoal && (
            <p className="text-[10px] text-muted">保存済み: {savedGoal} kcal</p>
          )}
        </Card>

        <Button variant="emerald" className="w-full" onClick={save} disabled={saving}>
          {saving ? "保存中..." : "保存する"}
        </Button>
        {message && <p className="text-sm text-center text-muted">{message}</p>}
      </Card>

      <p className="text-[10px] text-muted leading-relaxed">
        ※ Mifflin-St Jeor式による推定値です。医療アドバイスではありません。
      </p>
    </div>
  );
}
