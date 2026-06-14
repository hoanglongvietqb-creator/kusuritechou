import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { buildDaySummary } from "@/lib/day-summary";
import { generateText, isGeminiConfigured } from "@/lib/gemini";
import { db } from "@/lib/db";
import { nutritionArticles } from "@/lib/db/schema";

export async function GET() {
  const articles = await db
    .select({
      slug: nutritionArticles.slug,
      titleJa: nutritionArticles.titleJa,
      tags: nutritionArticles.tags,
    })
    .from(nutritionArticles)
    .orderBy(nutritionArticles.titleJa);

  return NextResponse.json(articles);
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "AI機能は利用できません" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const question = (body as { question?: string }).question?.trim();
  if (!question) {
    return NextResponse.json({ error: "質問を入力してください" }, { status: 400 });
  }

  const [summary, articles] = await Promise.all([
    buildDaySummary(authResult.userId),
    db.select().from(nutritionArticles).limit(5),
  ]);

  const articleExcerpt = articles
    .map((a) => `【${a.titleJa}】\n${a.bodyMd.slice(0, 300)}`)
    .join("\n\n");

  const prompt = `参考記事:\n${articleExcerpt}\n\n本日のデータ:\n${summary.text}\n\n質問: ${question}\n\n日本語で簡潔に回答。医学的診断はしないこと。`;

  try {
    const answer = await generateText(
      prompt,
      "あなたは親切な栄養アドバイザーです。一般的な参考情報として日本語で答えてください。"
    );
    return NextResponse.json({ answer });
  } catch (e) {
    console.error("nutrition/ask", e);
    return NextResponse.json({ error: "回答に失敗しました" }, { status: 500 });
  }
}
