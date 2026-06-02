"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "送信に失敗しました");
      return;
    }
    setMessage(data.message ?? "メールを送信しました");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <Card className="p-6">
        <CardTitle className="text-center mb-2">パスワード再設定</CardTitle>
        <p className="text-sm text-muted text-center mb-6">
          登録メールアドレスに再設定リンクを送信します
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">メール</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "送信中..." : "リンクを送信"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted mt-4">
          <Link href="/login" className="text-violet-ai-dark underline">
            ログインに戻る
          </Link>
        </p>
      </Card>
    </div>
  );
}
