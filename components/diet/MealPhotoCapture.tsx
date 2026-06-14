"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MEAL_PHOTO_DISCLAIMER } from "@/lib/constants";

type MealPhotoCaptureProps = {
  onLogged: () => void;
  disabled?: boolean;
};

type Analysis = {
  nameJa: string;
  calories: number;
  notes?: string;
};

export function MealPhotoCapture({ onLogged, disabled }: MealPhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [masterNote, setMasterNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setAnalysis(null);
    setMasterNote("");
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    const form = new FormData();
    form.append("image", file);

    try {
      const res = await fetch("/api/ai/analyze-meal-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "分析に失敗しました");
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  async function confirmLog() {
    if (!analysis) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/diet/log-from-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameJa: analysis.nameJa,
          calories: analysis.calories,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "記録に失敗しました");
      setMasterNote(
        data.createdMaster ? "マスタに追加しました" : "マスタから選択しました"
      );
      setPreview(null);
      setAnalysis(null);
      onLogged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setPreview(null);
    setAnalysis(null);
    setMasterNote("");
    setError("");
  }

  return (
    <Card className="p-4 border-emerald-nut/30 space-y-3">
      <h3 className="font-semibold text-sm">写真から記録</h3>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        variant="emerald"
        className="w-full"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading && !analysis ? "分析中..." : "📷 写真を撮る / 選ぶ"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {masterNote && (
        <p className="text-sm text-emerald-nut-dark">{masterNote}</p>
      )}

      {preview && analysis && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="preview"
            className="w-full rounded-xl max-h-48 object-cover"
          />
          <p className="text-sm">
            <span className="font-medium">{analysis.nameJa}</span>
            <br />
            <span className="text-emerald-nut-dark">{analysis.calories} kcal</span>
            {analysis.notes && (
              <span className="text-muted block text-xs mt-1">{analysis.notes}</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="emerald" className="flex-1" onClick={confirmLog} disabled={loading}>
              {loading ? "記録中..." : "記録する"}
            </Button>
            <Button variant="outline" onClick={cancel}>
              取消
            </Button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted leading-relaxed">{MEAL_PHOTO_DISCLAIMER}</p>
    </Card>
  );
}
