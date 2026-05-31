"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AI_DISCLAIMER } from "@/lib/constants";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatThread() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then((data: Message[]) => setMessages(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    let assistant = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "送信に失敗しました");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("ストリームを開けません");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: assistant };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: e instanceof Error ? e.message : "エラーが発生しました",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-12rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted text-center py-8">
            健康・食事・服薬について何でもご質問ください
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-violet-ai-dark text-white"
                  : "bg-stone-100 text-foreground"
              }`}
            >
              {m.content || (loading && m.role === "assistant" ? "..." : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <p className="text-[10px] text-muted mb-2">{AI_DISCLAIMER}</p>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <Button variant="violet" onClick={send} disabled={loading}>
          送信
        </Button>
      </div>
    </div>
  );
}
