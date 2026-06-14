"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MedCard, type Medication } from "@/components/medications/MedCard";
import { MedicationForm } from "@/components/medications/MedicationForm";
import { Plus } from "lucide-react";
import Link from "next/link";
import { formatTokyo } from "@/lib/timezone";

export default function MedicationsPage() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/medications");
    const data = await res.json();
    setMeds(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const dateStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Tokyo",
    });
    fetch(`/api/dashboard`)
      .then((r) => r.json())
      .then(() => {});
  }, [load]);

  async function checkIn(id: string) {
    const res = await fetch(`/api/medications/${id}/log`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "duplicate") {
        throw new Error(data.message);
      }
      throw new Error(data.error ?? "失敗しました");
    }
    setLogs((prev) => ({
      ...prev,
      [id]: formatTokyo(new Date(data.takenAt), "HH:mm"),
    }));
  }

  async function saveMed(body: {
    name: string;
    dosage: string;
    scheduleTimes: string[];
    foodTiming: "before_meal" | "after_meal" | "empty_stomach" | "any";
    contraindications?: string;
  }) {
    const url = editing ? `/api/medications/${editing.id}` : "/api/medications";
    const method = editing ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function deleteMed(id: string) {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/medications/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-rose-med-dark">服薬管理</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/settings/notifications"
            className="text-xs text-rose-med-dark underline"
          >
            通知
          </Link>
          {!showForm && !editing && (
            <Button variant="rose" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              追加
            </Button>
          )}
        </div>
      </div>

      {(showForm || editing) && (
        <MedicationForm
          initial={editing ?? undefined}
          onSubmit={saveMed}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {loading ? (
        <p className="text-muted text-center">読み込み中...</p>
      ) : meds.length === 0 ? (
        <p className="text-muted text-center py-8">
          薬が登録されていません。追加ボタンから登録してください。
        </p>
      ) : (
        <div className="space-y-4">
          {meds.map((med) => (
            <MedCard
              key={med.id}
              med={med}
              lastTakenAt={logs[med.id]}
              onCheckIn={checkIn}
              onEdit={(m) => {
                setEditing(m);
                setShowForm(false);
              }}
              onDelete={deleteMed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
