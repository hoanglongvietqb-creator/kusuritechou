"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FOOD_TIMING_LABEL } from "@/lib/constants";
import type { FoodTiming } from "@/lib/db/schema";
import { Clock, AlertTriangle } from "lucide-react";

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  scheduleTimes: string[];
  foodTiming: FoodTiming;
  contraindications: string | null;
};

type MedCardProps = {
  med: Medication;
  lastTakenAt?: string | null;
  onCheckIn: (id: string) => Promise<void>;
  onEdit?: (med: Medication) => void;
  onDelete?: (id: string) => void;
};

export function MedCard({
  med,
  lastTakenAt,
  onCheckIn,
  onEdit,
  onDelete,
}: MedCardProps) {
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleCheckIn() {
    setLoading(true);
    setWarning(null);
    try {
      await onCheckIn(med.id);
    } catch (e) {
      setWarning(e instanceof Error ? e.message : "記録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-rose-med/30">
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle className="text-rose-med-dark">{med.name}</CardTitle>
          <p className="text-sm text-muted mt-1">{med.dosage}</p>
        </div>
        {lastTakenAt && (
          <span className="flex items-center gap-1 text-xs text-emerald-nut-dark bg-emerald-50 px-2 py-1 rounded-lg">
            <Clock className="h-3 w-3" />
            {lastTakenAt}
          </span>
        )}
      </div>
      <p className="text-sm mt-2">
        服用時間: {(med.scheduleTimes as string[]).join(" · ")}
      </p>
      <p className="text-sm text-muted">
        {FOOD_TIMING_LABEL[med.foodTiming]}
      </p>
      {med.contraindications && (
        <p className="text-xs text-amber-700 mt-2 flex gap-1">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {med.contraindications}
        </p>
      )}
      {warning && (
        <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg">
          {warning}
        </p>
      )}
      <div className="flex gap-2 mt-4">
        <Button
          variant="rose"
          className="flex-1"
          disabled={loading}
          onClick={handleCheckIn}
        >
          服用済み
        </Button>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(med)}>
            編集
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(med.id)}>
            削除
          </Button>
        )}
      </div>
    </Card>
  );
}
