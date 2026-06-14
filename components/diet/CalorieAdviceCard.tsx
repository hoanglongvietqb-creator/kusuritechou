"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AI_DISCLAIMER } from "@/lib/constants";

type CalorieAdvice = {
  maintenanceKcal: number;
  todayKcal: number;
  weekAvgKcal: number;
  assessment: string;
  tips: string[];
  fallback?: boolean;
};

type CalorieAdviceCardProps = {
  hasProfile: boolean;
  todayKcal: number;
  dailyGoal: number;
};

export function CalorieAdviceCard({
  hasProfile,
  todayKcal,
  dailyGoal,
}: CalorieAdviceCardProps) {
  const [advice, setAdvice] = useState<CalorieAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAdvice() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/calorie-advice", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "取得に失敗しました");
      setAdvice(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setLoading(false);
    }
  }

  if (!hasProfile) {
    return (
      <Card className="p-4 border-amber-200 bg-amber-50/50">
        <p className="text-sm text-muted">
          AIカロリーアドバイスを利用するには
          <a href="/diet/profile" className="text-emerald-nut-dark underline mx-1">
            栄養プロフィール
          </a>
          を設定してください。
        </p>
      </Card>
    );
  }

  const diff = todayKcal - dailyGoal;

  return (
    <Card className="p-4 border-emerald-nut/30 space-y-3">
      <h3 className="font-semibold text-sm">AIカロリーアドバイス</h3>
      <p className="text-xs text-muted">
        維持目標: {dailyGoal} kcal / 本日: {todayKcal} kcal
        {diff !== 0 && (
          <span className={diff > 0 ? "text-amber-700" : "text-sky-700"}>
            {" "}
            ({diff > 0 ? "+" : ""}
            {diff} kcal)
          </span>
        )}
      </p>

      {!advice ? (
        <Button variant="emerald" size="sm" onClick={loadAdvice} disabled={loading}>
          {loading ? "分析中..." : "アドバイスを見る"}
        </Button>
      ) : (
        <div className="space-y-2 text-sm">
          <p>{advice.assessment}</p>
          <ul className="list-disc pl-4 space-y-1 text-muted">
            {advice.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="text-[10px] text-muted">
            週平均: {advice.weekAvgKcal} kcal/日
            {advice.fallback && "（簡易表示）"}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-[10px] text-muted leading-relaxed">{AI_DISCLAIMER}</p>
    </Card>
  );
}
