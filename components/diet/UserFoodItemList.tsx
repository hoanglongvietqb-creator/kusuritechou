"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type UserFoodItem = {
  id: string;
  nameJa: string;
  calories: number;
  kind: "food" | "drink";
};

type UserFoodItemListProps = {
  items: UserFoodItem[];
  onChanged: () => void;
};

export function UserFoodItemList({ items, onChanged }: UserFoodItemListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameJa, setNameJa] = useState("");
  const [calories, setCalories] = useState("");

  function startEdit(item: UserFoodItem) {
    setEditingId(item.id);
    setNameJa(item.nameJa);
    setCalories(String(item.calories));
  }

  async function saveEdit(id: string) {
    const kcal = parseInt(calories, 10);
    if (!nameJa.trim() || !kcal) return;
    await fetch(`/api/diet/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameJa: nameJa.trim(), calories: kcal }),
    });
    setEditingId(null);
    onChanged();
  }

  async function remove(id: string) {
    if (!confirm("このメニューを削除しますか？")) return;
    await fetch(`/api/diet/items/${id}`, { method: "DELETE" });
    onChanged();
  }

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="font-semibold text-sm mb-2">マイメニュー</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="bg-emerald-50 rounded-xl px-3 py-2 text-sm">
            {editingId === item.id ? (
              <div className="space-y-2">
                <Input value={nameJa} onChange={(e) => setNameJa(e.target.value)} />
                <Input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="emerald" onClick={() => saveEdit(item.id)}>
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-2">
                <span>
                  {item.nameJa}{" "}
                  <span className="text-muted">
                    ({item.kind === "drink" ? "飲み物" : "食べ物"})
                  </span>
                  <br />
                  <span className="text-emerald-nut-dark">{item.calories} kcal</span>
                </span>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                    編集
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(item.id)}>
                    削除
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
