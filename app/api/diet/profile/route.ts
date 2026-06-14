import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { userNutritionProfiles } from "@/lib/db/schema";
import { computeDailyCalorieGoal } from "@/lib/tdee";

const profileSchema = z.object({
  gender: z.enum(["male", "female", "other"]),
  birthYear: z.number().int().min(1920).max(2015),
  heightCm: z.number().int().min(100).max(250),
  weightKg: z.number().int().min(30).max(200),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active"]),
  goalType: z.enum(["maintain", "lose", "gain"]),
});

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const [profile] = await db
    .select()
    .from(userNutritionProfiles)
    .where(eq(userNutritionProfiles.userId, authResult.userId))
    .limit(1);

  return NextResponse.json({ profile: profile ?? null });
}

export async function PATCH(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const dailyCalorieGoal = computeDailyCalorieGoal(parsed.data);

  const [existing] = await db
    .select({ id: userNutritionProfiles.id })
    .from(userNutritionProfiles)
    .where(eq(userNutritionProfiles.userId, authResult.userId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(userNutritionProfiles)
      .set({
        ...parsed.data,
        dailyCalorieGoal,
        updatedAt: new Date(),
      })
      .where(eq(userNutritionProfiles.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(userNutritionProfiles)
    .values({
      userId: authResult.userId,
      ...parsed.data,
      dailyCalorieGoal,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
