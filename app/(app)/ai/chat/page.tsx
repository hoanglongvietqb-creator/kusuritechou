import Link from "next/link";
import { ChatThread } from "@/components/ai/ChatThread";

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/ai" className="text-sm text-violet-ai-dark">
          ← AIメニュー
        </Link>
        <h1 className="text-2xl font-bold text-violet-ai-dark mt-2">
          AI相談チャット
        </h1>
      </div>
      <ChatThread />
    </div>
  );
}
