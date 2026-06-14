"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AI_DISCLAIMER } from "@/lib/constants";

type Article = {
  slug: string;
  titleJa: string;
  tags: string[];
};

export default function NutritionPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<{
    slug: string;
    titleJa: string;
    bodyMd: string;
  } | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/nutrition")
      .then((r) => r.json())
      .then(setArticles);
  }, []);

  async function openArticle(slug: string) {
    const res = await fetch(`/api/nutrition/${slug}`);
    setSelected(await res.json());
  }

  async function askAi() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    const res = await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setAnswer(data.error ?? "エラー");
      return;
    }
    setAnswer(data.answer);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/diet" className="text-sm text-emerald-nut-dark">
          ← 食事
        </Link>
        <h1 className="text-2xl font-bold text-emerald-nut-dark mt-2">
          栄養の知識
        </h1>
      </div>

      {selected ? (
        <Card className="p-4 space-y-3">
          <button
            type="button"
            className="text-sm text-emerald-nut-dark underline"
            onClick={() => setSelected(null)}
          >
            ← 一覧に戻る
          </button>
          <h2 className="font-bold">{selected.titleJa}</h2>
          <div className="text-sm whitespace-pre-wrap text-muted leading-relaxed">
            {selected.bodyMd}
          </div>
        </Card>
      ) : (
        <ul className="space-y-2">
          {articles.map((a) => (
            <li key={a.slug}>
              <button
                type="button"
                onClick={() => openArticle(a.slug)}
                className="w-full text-left bg-emerald-50 rounded-xl px-3 py-3 text-sm hover:bg-emerald-100"
              >
                {a.titleJa}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Card className="p-4 space-y-3 border-violet-ai/30">
        <h2 className="font-semibold text-sm text-violet-ai-dark">AIに質問</h2>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例：デスクワーク向けの昼食は？"
          onKeyDown={(e) => e.key === "Enter" && askAi()}
        />
        <Button variant="violet" onClick={askAi} disabled={loading}>
          {loading ? "考え中..." : "質問する"}
        </Button>
        {answer && (
          <p className="text-sm bg-stone-50 rounded-xl p-3 whitespace-pre-wrap">
            {answer}
          </p>
        )}
        <p className="text-[10px] text-muted">{AI_DISCLAIMER}</p>
      </Card>
    </div>
  );
}
