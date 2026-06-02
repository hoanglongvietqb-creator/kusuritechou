import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { buildDaySummary } from "@/lib/day-summary";
import { generateDailyReport } from "@/lib/ai-generate-report";
import { isGeminiConfigured } from "@/lib/gemini";
import { db } from "@/lib/db";
import { aiReports } from "@/lib/db/schema";

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

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI機能は利用できません。Vercelの環境変数 GEMINI_API_KEY を設定してください。",
      },
      { status: 503 }
    );
  }

  try {
    const result = await generateDailyReport(summary.text);

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
    console.error("ai/analyze", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg === "GEMINI_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "AI機能は利用できません（APIキー未設定）" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error:
          "分析に失敗しました。GEMINI_API_KEY を確認するか、しばらくして再試行してください。",
      },
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
    hasData:
      summary.totalCalories > 0 ||
      summary.totalWater > 0 ||
      summary.medicationCount > 0,
    geminiConfigured: isGeminiConfigured(),
  });
}
