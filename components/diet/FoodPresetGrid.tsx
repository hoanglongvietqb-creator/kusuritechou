"use client";

import { Button } from "@/components/ui/button";

export type FoodPreset = {
  id: string;
  nameJa: string;
  calories: number;
  category: string | null;
};

type FoodPresetGridProps = {
  presets: FoodPreset[];
  onSelect: (preset: FoodPreset) => void;
  loading?: boolean;
};

export function FoodPresetGrid({
  presets,
  onSelect,
  loading,
}: FoodPresetGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {presets.map((p) => (
        <Button
          key={p.id}
          variant="outline"
          disabled={loading}
          onClick={() => onSelect(p)}
          className="h-auto flex-col items-start p-3 text-left border-emerald-nut/30 hover:bg-emerald-50"
        >
          <span className="font-medium text-sm">{p.nameJa}</span>
          <span className="text-xs text-emerald-nut-dark">{p.calories} kcal</span>
        </Button>
      ))}
    </div>
  );
}
