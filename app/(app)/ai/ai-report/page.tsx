"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportTabs } from "@/components/ai/ReportTabs";
import type { AiReportResult } from "@/lib/db/schema";
import Link from "next/link";

export default function AiReportPage() {
  const [result, setResult] = useState<AiReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ai/analyze")
      .then((r) => r.json())
      .then((d) => {
        if (d.result) setResult(d.result);
      })
      .catch(() => {});
  }, []);

  async function analyze(force = false) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "分析に失敗しました");
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ai" className="text-sm text-violet-ai-dark">
          ← AIメニュー
        </Link>
        <h1 className="text-2xl font-bold text-violet-ai-dark mt-2">
          AI栄養レポート
        </h1>
      </div>

      <div className="flex gap-2">
        <Button
          variant="violet"
          className="flex-1"
          disabled={loading}
          onClick={() => analyze(false)}
        >
          {loading ? "分析中..." : "分析を開始"}
        </Button>
        {result && (
          <Button variant="outline" disabled={loading} onClick={() => analyze(true)}>
            再分析
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result ? (
        <ReportTabs result={result} />
      ) : (
        !loading && (
          <p className="text-sm text-muted text-center py-8">
            本日の食事・水分・服薬を記録してから分析を開始してください
          </p>
        )
      )}
    </div>
  );
}
