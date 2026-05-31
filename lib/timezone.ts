import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const APP_TIMEZONE = "Asia/Tokyo";

export function nowInTokyo(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

export function formatTokyo(date: Date, fmt: string): string {
  return formatInTimeZone(date, APP_TIMEZONE, fmt);
}

export function todayDateStringTokyo(): string {
  return formatTokyo(new Date(), "yyyy-MM-dd");
}

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export const DAY_PERIOD_LABELS: Record<DayPeriod, string> = {
  morning: "朝",
  afternoon: "昼",
  evening: "夕",
  night: "夜",
};

export function getDayPeriod(hour: number): DayPeriod {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "afternoon";
  if (hour >= 15 && hour < 19) return "evening";
  return "night";
}

export function getPeriodFromTimeString(time: string): DayPeriod {
  const [h] = time.split(":").map(Number);
  return getDayPeriod(h ?? 0);
}
