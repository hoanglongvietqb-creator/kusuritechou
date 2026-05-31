import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageCircle } from "lucide-react";

export default function AiHubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-violet-ai-dark">AI健康サポート</h1>

      <Link href="/ai/ai-report">
        <Card className="p-5 border-violet-ai/30 hover:bg-violet-50/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-violet-100 p-3">
              <Sparkles className="h-6 w-6 text-violet-ai-dark" />
            </div>
            <div>
              <CardTitle>AI栄養レポート</CardTitle>
              <p className="text-sm text-muted mt-1">
                食事・水分・服薬データを分析し、3つの観点でアドバイス
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Link href="/ai/chat">
        <Card className="p-5 border-violet-ai/30 hover:bg-violet-50/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-violet-100 p-3">
              <MessageCircle className="h-6 w-6 text-violet-ai-dark" />
            </div>
            <div>
              <CardTitle>AI相談チャット</CardTitle>
              <p className="text-sm text-muted mt-1">
                24時間いつでも健康・食事・服薬の質問に回答
              </p>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
