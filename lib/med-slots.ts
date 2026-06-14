import { formatTokyo } from "@/lib/timezone";

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isSlotTakenToday(
  logs: { takenAt: Date; medicationId: string }[],
  medicationId: string,
  slotTime: string,
  dateStr: string
): boolean {
  const [h, m] = slotTime.split(":").map(Number);
  const slotStart = new Date(
    `${dateStr}T${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00+09:00`
  );
  const windowEnd = new Date(slotStart.getTime() + 90 * 60 * 1000);

  return logs.some(
    (l) =>
      l.medicationId === medicationId &&
      l.takenAt >= slotStart &&
      l.takenAt <= windowEnd
  );
}

export function getNowMinutesTokyo(now = new Date()): number {
  return (
    parseInt(formatTokyo(now, "H"), 10) * 60 +
    parseInt(formatTokyo(now, "m"), 10)
  );
}

export function isInQuietHours(
  nowMinutes: number,
  quietStart?: string | null,
  quietEnd?: string | null
): boolean {
  if (!quietStart || !quietEnd) return false;
  const start = parseTimeToMinutes(quietStart);
  const end = parseTimeToMinutes(quietEnd);
  if (start <= end) {
    return nowMinutes >= start && nowMinutes < end;
  }
  return nowMinutes >= start || nowMinutes < end;
}
