"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Prefs = {
  emailReminders: boolean;
  pushReminders: boolean;
  preDoseEnabled: boolean;
  overdueEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [pushStatus, setPushStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications/preferences");
    setPrefs(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(updates: Partial<Prefs>) {
    setLoading(true);
    const res = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setPrefs(await res.json());
    setLoading(false);
  }

  async function enablePush() {
    setPushStatus("");
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("このブラウザは通知に対応していません");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushStatus("通知が許可されていません");
      return;
    }

    const keyRes = await fetch("/api/notifications/subscribe");
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      setPushStatus("プッシュ通知はサーバーで未設定です");
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = sub.toJSON();
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });

    await save({ pushReminders: true });
    setPushStatus("通知を有効にしました。ホーム画面に追加すると確実です。");
  }

  if (!prefs) {
    return <p className="text-muted text-center py-12">読み込み中...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/medications" className="text-sm text-rose-med-dark">
          ← 服薬
        </Link>
        <h1 className="text-2xl font-bold text-rose-med-dark mt-2">通知設定</h1>
        <p className="text-sm text-muted mt-1">
          服薬1時間前と未記録時にメール・プッシュでお知らせします
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <label className="flex items-center justify-between text-sm">
          <span>メール通知</span>
          <input
            type="checkbox"
            checked={prefs.emailReminders}
            onChange={(e) => save({ emailReminders: e.target.checked })}
            disabled={loading}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>プッシュ通知</span>
          <input
            type="checkbox"
            checked={prefs.pushReminders}
            onChange={(e) => save({ pushReminders: e.target.checked })}
            disabled={loading}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>服用1時間前のリマインド</span>
          <input
            type="checkbox"
            checked={prefs.preDoseEnabled}
            onChange={(e) => save({ preDoseEnabled: e.target.checked })}
            disabled={loading}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>未記録時（1時間ごと）</span>
          <input
            type="checkbox"
            checked={prefs.overdueEnabled}
            onChange={(e) => save({ overdueEnabled: e.target.checked })}
            disabled={loading}
          />
        </label>
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-medium">おやすみ時間（任意）</p>
        <div className="flex gap-2 items-center">
          <Input
            type="time"
            value={prefs.quietHoursStart ?? ""}
            onChange={(e) => save({ quietHoursStart: e.target.value || null })}
          />
          <span className="text-muted">〜</span>
          <Input
            type="time"
            value={prefs.quietHoursEnd ?? ""}
            onChange={(e) => save({ quietHoursEnd: e.target.value || null })}
          />
        </div>
      </Card>

      <Button variant="rose" className="w-full" onClick={enablePush}>
        通知を許可する
      </Button>
      {pushStatus && <p className="text-sm text-emerald-700">{pushStatus}</p>}

      <p className="text-xs text-muted leading-relaxed">
        iPhoneでは「ホーム画面に追加」してから通知を許可してください。AndroidのChromeでも同様にPWAとして使えます。
      </p>
    </div>
  );
}
