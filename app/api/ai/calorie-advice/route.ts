import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { buildDaySummary } from "@/lib/day-summary";
import { db } from "@/lib/db";
import { userNutritionProfiles } from "@/lib/db/schema";
import { getMealHistory } from "@/lib/meal-stats";
import { generateText, isGeminiConfigured } from "@/lib/gemini";
import { parseJsonFromModel } from "@/lib/ai-parse";

const ADVICE_SYSTEM = `あなたは栄養アドバイザーです。デスクワーク中心の生活者向けに、維持カロリーと実際の摂取を比較してアドバイスしてください。
医療診断は行わず、一般的な生活習慣の提案に留めること。
JSONのみを返す:
{
  "maintenanceKcal": 数値,
  "todayKcal": 数値,
  "weekAvgKcal": 数値,
  "assessment": "2-3文の日本語評価",
  "tips": ["tip1", "tip2", "tip3"]
}`;

export async function POST() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const [profile] = await db
    .select()
    .from(userNutritionProfiles)
    .where(eq(userNutritionProfiles.userId, authResult.userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json(
      { error: "栄養プロフィールを先に設定してください" },
      { status: 400 }
    );
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "AI機能は利用できません（APIキー未設定）" },
      { status: 503 }
    );
  }

  const [summary, weekHistory] = await Promise.all([
    buildDaySummary(authResult.userId),
    getMealHistory(authResult.userId, "week"),
  ]);

  const prompt = `
維持目標カロリー（TDEE推定）: ${profile.dailyCalorieGoal} kcal
活動レベル: ${profile.activityLevel}
目標: ${profile.goalType}

本日の摂取: ${summary.totalCalories} kcal
週間平均: ${weekHistory.averageCalories} kcal/日

【本日の記録サマリー】
${summary.text}

デスクワークで運動が少ない人向けに、維持カロリーとの差と改善のヒントを日本語で返してください。
`.trim();

  try {
    const raw = await generateText(prompt, ADVICE_SYSTEM);
    const parsed = parseJsonFromModel<{
      maintenanceKcal: number;
      todayKcal: number;
      weekAvgKcal: number;
      assessment: string;
      tips: string[];
    }>(raw);

    return NextResponse.json({
      ...parsed,
      maintenanceKcal: parsed.maintenanceKcal ?? profile.dailyCalorieGoal,
      todayKcal: parsed.todayKcal ?? summary.totalCalories,
      weekAvgKcal: parsed.weekAvgKcal ?? weekHistory.averageCalories,
    });
  } catch (e) {
    console.error("calorie-advice", e);
    const maintenanceKcal = profile.dailyCalorieGoal;
    const todayKcal = summary.totalCalories;
    const weekAvgKcal = weekHistory.averageCalories;
    const diff = todayKcal - maintenanceKcal;
    return NextResponse.json({
      maintenanceKcal,
      todayKcal,
      weekAvgKcal,
      assessment:
        diff > 200
          ? `本日は維持目標より約${diff}kcal多めです。`
          : diff < -200
            ? `本日は維持目標より約${Math.abs(diff)}kcal少なめです。`
            : "本日の摂取は維持目標のおおよそ範囲内です。",
      tips: [
        "デスクワーク中は1時間に一度立って歩く",
        "昼食は野菜とたんぱく質を意識する",
        "間食はナッツやヨーグルトなど量を決めて",
      ],
      fallback: true,
    });
  }
}
