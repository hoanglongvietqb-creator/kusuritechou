import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { buildDaySummary } from "@/lib/day-summary";
import { generateText } from "@/lib/gemini";
import { db } from "@/lib/db";
import { aiReports, type AiReportResult } from "@/lib/db/schema";

const SYSTEM = `あなたは栄養・服薬アドバイザーです。日本語で回答し、JSONのみを返してください。
形式:
{
  "supplements": [{"title": "...", "detail": "..."}],
  "limits": [{"title": "...", "detail": "..."}],
  "medicationSafety": [{"title": "...", "detail": "..."}]
}
各配列は2〜4項目。医学的診断はせず、一般的な参考情報として述べること。`;

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json().catch(() => ({}));
  const force = (body as { force?: boolean }).force === true;

  const summary = await buildDaySummary(authResult.userId);

  if (!force) {
    const cached = await db
      .select()
      .from(aiReports)
      .where(
        and(
          eq(aiReports.userId, authResult.userId),
          eq(aiReports.reportDate, summary.dateStr)
        )
      )
      .limit(1);

    if (cached[0]) {
      return NextResponse.json({ cached: true, result: cached[0].result });
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI機能は現在利用できません（APIキー未設定）" },
      { status: 503 }
    );
  }

  try {
    const raw = await generateText(
      `以下の本日の健康データを分析してください:\n\n${summary.text}`,
      SYSTEM
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON from model");
    }

    const result = JSON.parse(jsonMatch[0]) as AiReportResult;

    const existing = await db
      .select({ id: aiReports.id })
      .from(aiReports)
      .where(
        and(
          eq(aiReports.userId, authResult.userId),
          eq(aiReports.reportDate, summary.dateStr)
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(aiReports)
        .set({ result, createdAt: new Date() })
        .where(eq(aiReports.id, existing[0].id));
    } else {
      await db.insert(aiReports).values({
        userId: authResult.userId,
        reportDate: summary.dateStr,
        result,
      });
    }

    return NextResponse.json({ cached: false, result });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "分析に失敗しました。しばらくして再試行してください。" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const summary = await buildDaySummary(authResult.userId);

  const cached = await db
    .select()
    .from(aiReports)
    .where(
      and(
        eq(aiReports.userId, authResult.userId),
        eq(aiReports.reportDate, summary.dateStr)
      )
    )
    .limit(1);

  return NextResponse.json({
    date: summary.dateStr,
    result: cached[0]?.result ?? null,
  });
}
