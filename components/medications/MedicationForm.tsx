"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FOOD_TIMING_OPTIONS } from "@/lib/constants";
import type { FoodTiming } from "@/lib/db/schema";
import type { Medication } from "./MedCard";

type MedicationFormProps = {
  initial?: Medication;
  onSubmit: (data: {
    name: string;
    dosage: string;
    scheduleTimes: string[];
    foodTiming: FoodTiming;
    contraindications?: string;
  }) => Promise<void>;
  onCancel: () => void;
};

export function MedicationForm({ initial, onSubmit, onCancel }: MedicationFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [dosage, setDosage] = useState(initial?.dosage ?? "");
  const [times, setTimes] = useState(
    (initial?.scheduleTimes as string[])?.join(", ") ?? "08:00, 20:00"
  );
  const [foodTiming, setFoodTiming] = useState<FoodTiming>(
    initial?.foodTiming ?? "any"
  );
  const [contra, setContra] = useState(initial?.contraindications ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scheduleTimes = times
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!name || !dosage || scheduleTimes.length === 0) return;
    setLoading(true);
    try {
      await onSubmit({
        name,
        dosage,
        scheduleTimes,
        foodTiming,
        contraindications: contra || undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">薬名</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm font-medium">用量</label>
        <Input
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="例: 1錠"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">服用時間（カンマ区切り）</label>
        <Input
          value={times}
          onChange={(e) => setTimes(e.target.value)}
          placeholder="08:00, 12:00, 20:00"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">食事との関係</label>
        <select
          className="flex h-11 w-full rounded-xl border border-border bg-surface-elevated px-3"
          value={foodTiming}
          onChange={(e) => setFoodTiming(e.target.value as FoodTiming)}
        >
          {FOOD_TIMING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">併用注意</label>
        <Input
          value={contra}
          onChange={(e) => setContra(e.target.value)}
          placeholder="例: 牛乳と同時服用不可"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="rose" disabled={loading} className="flex-1">
          保存
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
