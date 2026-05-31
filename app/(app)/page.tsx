"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Pill, UtensilsCrossed, Sparkles } from "lucide-react";

type TimelinePeriod = {
  period: string;
  label: string;
  items: {
    type: string;
    time: string;
    title: string;
    subtitle?: string;
    status: string;
    medicationId?: string;
  }[];
};

type DashboardData = {
  date: string;
  summary: {
    totalWater: number;
    goalMl: number;
    totalCalories: number;
    medCount: number;
  };
  timeline: TimelinePeriod[];
};

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted text-center py-12">読み込み中...</p>;
  }

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">今日</h1>
        <p className="text-sm text-muted">{data?.date}</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Link href="/hydration">
          <Card className="p-3 text-center border-water/30">
            <Droplets className="h-5 w-5 mx-auto text-water-dark" />
            <p className="text-xs text-muted mt-1">水分</p>
            <p className="font-semibold text-sm">
              {s?.totalWater ?? 0}/{s?.goalMl ?? 2000}
            </p>
          </Card>
        </Link>
        <Link href="/medications">
          <Card className="p-3 text-center border-rose-med/30">
            <Pill className="h-5 w-5 mx-auto text-rose-med-dark" />
            <p className="text-xs text-muted mt-1">服薬</p>
            <p className="font-semibold text-sm">{s?.medCount ?? 0}種</p>
          </Card>
        </Link>
        <Link href="/diet">
          <Card className="p-3 text-center border-emerald-nut/30">
            <UtensilsCrossed className="h-5 w-5 mx-auto text-emerald-nut-dark" />
            <p className="text-xs text-muted mt-1">カロリー</p>
            <p className="font-semibold text-sm">{s?.totalCalories ?? 0}</p>
          </Card>
        </Link>
      </div>

      <Link href="/ai/ai-report">
        <Button variant="violet" className="w-full gap-2">
          <Sparkles className="h-4 w-4" />
          AI栄養レポートを見る
        </Button>
      </Link>

      <section className="space-y-4">
        <h2 className="font-semibold">今日のスケジュール</h2>
        {data?.timeline.map((block) => (
          <div key={block.period}>
            <h3 className="text-sm font-medium text-muted mb-2">{block.label}</h3>
            {block.items.length === 0 ? (
              <p className="text-xs text-muted pl-2">予定なし</p>
            ) : (
              <ul className="space-y-2">
                {block.items.map((item, i) => (
                  <li key={`${item.time}-${i}`}>
                    <Card
                      className={`p-3 flex gap-3 items-center ${
                        item.status === "overdue"
                          ? "border-amber-400 bg-amber-50/50"
                          : item.status === "done"
                            ? "opacity-70"
                            : ""
                      }`}
                    >
                      <span className="text-sm font-mono text-muted w-12">
                        {item.time}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-muted">{item.subtitle}</p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          item.status === "done"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "overdue"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {item.status === "done"
                          ? "完了"
                          : item.status === "overdue"
                            ? "遅延"
                            : "予定"}
                      </span>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
