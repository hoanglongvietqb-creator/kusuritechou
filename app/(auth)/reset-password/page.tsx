"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("リンクが無効です");
      return;
    }
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "更新に失敗しました");
      return;
    }

    router.push("/login?reset=1");
  }

  if (!token) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600 text-center">
          リンクが無効です。もう一度パスワード再設定を申請してください。
        </p>
        <p className="text-center text-sm mt-4">
          <Link href="/forgot-password" className="text-violet-ai-dark underline">
            パスワード再設定
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardTitle className="text-center mb-6">新しいパスワード</CardTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">新しいパスワード</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">確認</label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "更新中..." : "パスワードを更新"}
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <Suspense
        fallback={
          <Card className="p-6">
            <p className="text-sm text-muted text-center">読み込み中...</p>
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
