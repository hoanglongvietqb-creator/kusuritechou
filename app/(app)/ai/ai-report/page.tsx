"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportTabs } from "@/components/ai/ReportTabs";
import type { AiPeriodReportResult, AiReportResult } from "@/lib/db/schema";
import Link from "next/link";

type ReportScope = "day" | "week" | "month";

export default function AiReportPage() {
  const [scope, setScope] = useState<ReportScope>("day");
  const [result, setResult] = useState<AiReportResult | AiPeriodReportResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasData, setHasData] = useState(true);
  const [geminiConfigured, setGeminiConfigured] = useState(true);

  useEffect(() => {
    setResult(null);
    setError("");
    const url =
      scope === "day"
        ? "/api/ai/analyze"
        : `/api/ai/analyze-period?range=${scope}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.result) setResult(d.result);
        if (typeof d.hasData === "boolean") setHasData(d.hasData);
        if (typeof d.geminiConfigured === "boolean") {
          setGeminiConfigured(d.geminiConfigured);
        }
      })
      .catch(() => {});
  }, [scope]);

  async function analyze(force = false) {
    setLoading(true);
    setError("");
    try {
      const url =
        scope === "day" ? "/api/ai/analyze" : "/api/ai/analyze-period";
      const body =
        scope === "day"
          ? { force }
          : { force, range: scope };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const scopeLabel =
    scope === "day" ? "本日" : scope === "week" ? "週間" : "月間";

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

      <div className="flex gap-2 rounded-xl bg-violet-100 p-1">
        {(
          [
            ["day", "今日"],
            ["week", "週間"],
            ["month", "月間"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setScope(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              scope === key
                ? "bg-white text-violet-ai-dark shadow-sm"
                : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!geminiConfigured && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
          GEMINI_API_KEY が未設定です。Vercelの環境変数にキーを追加して再デプロイしてください。
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="violet"
          className="flex-1"
          disabled={loading || !geminiConfigured}
          onClick={() => analyze(false)}
        >
          {loading ? "分析中..." : `${scopeLabel}の分析を開始`}
        </Button>
        {result && (
          <Button variant="outline" disabled={loading} onClick={() => analyze(true)}>
            再分析
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result ? (
        <ReportTabs result={result} showPeriodTabs={scope !== "day"} />
      ) : (
        !loading && (
          <p className="text-sm text-muted text-center py-8">
            {hasData
              ? `${scopeLabel}のデータを記録してから分析を開始してください`
              : `まだ${scopeLabel}の記録がありません。水分・食事・服薬を記録してください`}
          </p>
        )
      )}
    </div>
  );
}
