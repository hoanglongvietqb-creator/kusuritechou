import type { FoodTiming } from "@/lib/db/schema";

export const FOOD_TIMING_OPTIONS: { value: FoodTiming; label: string }[] = [
  { value: "before_meal", label: "食前" },
  { value: "after_meal", label: "食後" },
  { value: "empty_stomach", label: "空腹時" },
  { value: "any", label: "指定なし" },
];

export const FOOD_TIMING_LABEL: Record<FoodTiming, string> = {
  before_meal: "食前",
  after_meal: "食後",
  empty_stomach: "空腹時",
  any: "指定なし",
};

export const AI_DISCLAIMER =
  "本アプリのAI機能は一般的な健康情報の参考であり、医療助言・診断・治療の代替にはなりません。症状がある場合は医療機関にご相談ください。";
