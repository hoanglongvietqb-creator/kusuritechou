import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { buildDaySummary } from "@/lib/day-summary";
import { streamText } from "@/lib/gemini";
import { checkChatRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { chatMessages } from "@/lib/db/schema";

const schema = z.object({
  message: z.string().min(1).max(2000),
});

const SYSTEM = `あなたは親切な健康・栄養アドバイザーです。日本語で簡潔に回答してください。
医学的診断や処方は行わず、一般的な情報と生活習慣のアドバイスに留めてください。
緊急の症状には医療機関への受診を勧めてください。`;

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const rate = checkChatRateLimit(authResult.userId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "1時間あたりの送信上限に達しました。しばらくお待ちください。" },
      { status: 429 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI機能は現在利用できません（APIキー未設定）" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const summary = await buildDaySummary(authResult.userId);
  const userMessage = parsed.data.message;

  await db.insert(chatMessages).values({
    userId: authResult.userId,
    role: "user",
    content: userMessage,
  });

  const prompt = `【ユーザーの本日の概要】\n${summary.text}\n\n【質問】\n${userMessage}`;

  const encoder = new TextEncoder();
  let fullReply = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chunks = await streamText(prompt, SYSTEM);
        for await (const text of chunks) {
          fullReply += text;
          controller.enqueue(encoder.encode(text));
        }
        await db.insert(chatMessages).values({
          userId: authResult.userId,
          role: "assistant",
          content: fullReply,
        });
        controller.close();
      } catch (e) {
        console.error(e);
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, authResult.userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(40);

  return NextResponse.json(messages.reverse());
}
