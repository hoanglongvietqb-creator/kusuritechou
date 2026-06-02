"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type CustomFoodFormProps = {
  onCreated: () => void;
};

export function CustomFoodForm({ onCreated }: CustomFoodFormProps) {
  const [nameJa, setNameJa] = useState("");
  const [calories, setCalories] = useState("");
  const [kind, setKind] = useState<"food" | "drink">("food");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const kcal = parseInt(calories, 10);
    if (!nameJa.trim() || !kcal) {
      setError("名前とカロリーを入力してください");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/diet/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameJa: nameJa.trim(), calories: kcal, kind }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "追加に失敗しました");
      return;
    }

    setNameJa("");
    setCalories("");
    onCreated();
  }

  return (
    <Card className="p-4 border-emerald-nut/30">
      <h3 className="font-semibold text-sm mb-3">自分のメニューを追加</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="名前（例：緑茶、フォー）"
          value={nameJa}
          onChange={(e) => setNameJa(e.target.value)}
        />
        <Input
          type="number"
          placeholder="カロリー (kcal)"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <div className="flex gap-2">
          {(["food", "drink"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 rounded-lg py-2 text-sm border ${
                kind === k
                  ? "bg-emerald-100 border-emerald-nut text-emerald-nut-dark"
                  : "border-gray-200 text-muted"
              }`}
            >
              {k === "food" ? "食べ物" : "飲み物"}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="emerald" className="w-full" disabled={loading}>
          {loading ? "追加中..." : "追加"}
        </Button>
      </form>
    </Card>
  );
}
