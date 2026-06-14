import type { ActivityLevel, Gender, GoalType } from "@/lib/db/schema";

export type NutritionProfileInput = {
  gender: Gender;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
};

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const GOAL_ADJUST: Record<GoalType, number> = {
  maintain: 0,
  lose: -400,
  gain: 300,
};

export function getAgeFromBirthYear(birthYear: number, now = new Date()): number {
  const year = parseInt(
    now.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }).slice(0, 4),
    10
  );
  return Math.max(15, Math.min(100, year - birthYear));
}

export function computeBmr(profile: NutritionProfileInput): number {
  const age = getAgeFromBirthYear(profile.birthYear);
  const { weightKg, heightCm, gender } = profile;

  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  if (gender === "female") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return (male + female) / 2;
}

export function computeDailyCalorieGoal(profile: NutritionProfileInput): number {
  const bmr = computeBmr(profile);
  const tdee = bmr * ACTIVITY_FACTORS[profile.activityLevel];
  const adjusted = tdee + GOAL_ADJUST[profile.goalType];
  return Math.round(Math.max(1200, Math.min(5000, adjusted)));
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "ほぼ座り仕事（デスクワーク）",
  light: "軽い運動（週1–3回）",
  moderate: "中程度（週3–5回）",
  active: "活発（ほぼ毎日）",
};

export const GOAL_LABELS: Record<GoalType, string> = {
  maintain: "体重維持",
  lose: "減量",
  gain: "増量",
};
