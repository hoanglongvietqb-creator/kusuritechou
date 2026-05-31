"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [150, 250, 400] as const;

type QuickAddButtonsProps = {
  onAdd: (amount: number) => Promise<void>;
  loading?: boolean;
};

export function QuickAddButtons({ onAdd, loading }: QuickAddButtonsProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customMl, setCustomMl] = useState("");

  async function handleCustom() {
    const n = parseInt(customMl, 10);
    if (!n || n <= 0) return;
    await onAdd(n);
    setCustomMl("");
    setCustomOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((ml) => (
          <Button
            key={ml}
            variant="water"
            size="sm"
            disabled={loading}
            onClick={() => onAdd(ml)}
            className="text-sm"
          >
            +{ml}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => setCustomOpen(!customOpen)}
        >
          自由
        </Button>
      </div>
      {customOpen && (
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="ml"
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            min={1}
          />
          <Button variant="water" onClick={handleCustom} disabled={loading}>
            追加
          </Button>
        </div>
      )}
    </div>
  );
}
