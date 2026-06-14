import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  medications,
  medLogs,
  notificationDeliveries,
  pushSubscriptions,
  users,
  type NotificationChannel,
  type NotificationType,
} from "@/lib/db/schema";
import { sendMedicationReminderEmail, isEmailConfigured } from "@/lib/email";
import { getOrCreateNotificationPreferences } from "@/lib/notification-prefs";
import {
  getNowMinutesTokyo,
  isInQuietHours,
  isSlotTakenToday,
  parseTimeToMinutes,
} from "@/lib/med-slots";
import { sendPushToUser, isPushConfigured } from "@/lib/push";
import { todayDateStringTokyo } from "@/lib/timezone";

export type ReminderToSend = {
  userId: string;
  email: string;
  medicationId: string;
  medName: string;
  slotTime: string;
  type: NotificationType;
  bucketKey: string;
};

const PRE_WINDOW = 7;
const GRACE_MINUTES = 15;

function getTodayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59.999+09:00`);
  return { start, end };
}

function formatHourBucket(now: Date): string {
  const d = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}`;
}

async function alreadySent(
  userId: string,
  type: NotificationType,
  medicationId: string,
  slotTime: string,
  channel: NotificationChannel,
  bucketKey: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: notificationDeliveries.id })
    .from(notificationDeliveries)
    .where(
      and(
        eq(notificationDeliveries.userId, userId),
        eq(notificationDeliveries.type, type),
        eq(notificationDeliveries.medicationId, medicationId),
        eq(notificationDeliveries.slotTime, slotTime),
        eq(notificationDeliveries.channel, channel),
        eq(notificationDeliveries.bucketKey, bucketKey)
      )
    )
    .limit(1);
  return !!row;
}

async function recordSent(
  userId: string,
  type: NotificationType,
  medicationId: string,
  slotTime: string,
  channel: NotificationChannel,
  bucketKey: string
) {
  await db.insert(notificationDeliveries).values({
    userId,
    type,
    medicationId,
    slotTime,
    channel,
    bucketKey,
  });
}

export async function collectReminders(now = new Date()): Promise<ReminderToSend[]> {
  const dateStr = todayDateStringTokyo();
  const { start, end } = getTodayBounds(dateStr);
  const nowMinutes = getNowMinutesTokyo(now);
  const hourBucket = formatHourBucket(now);

  const allMeds = await db.select().from(medications);
  const allUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users);

  const userEmailMap = new Map(allUsers.map((u) => [u.id, u.email]));
  const reminders: ReminderToSend[] = [];

  for (const med of allMeds) {
    const email = userEmailMap.get(med.userId);
    if (!email) continue;

    const prefs = await getOrCreateNotificationPreferences(med.userId);
    if (isInQuietHours(nowMinutes, prefs.quietHoursStart, prefs.quietHoursEnd)) {
      continue;
    }

    const logs = await db
      .select()
      .from(medLogs)
      .where(
        and(
          eq(medLogs.userId, med.userId),
          eq(medLogs.medicationId, med.id),
          gte(medLogs.takenAt, start),
          lt(medLogs.takenAt, new Date(end.getTime() + 1))
        )
      );

    for (const slotTime of med.scheduleTimes as string[]) {
      if (isSlotTakenToday(logs, med.id, slotTime, dateStr)) continue;

      const slotMinutes = parseTimeToMinutes(slotTime);
      const preTarget = slotMinutes - 60;

      if (
        prefs.preDoseEnabled &&
        Math.abs(nowMinutes - preTarget) <= PRE_WINDOW
      ) {
        reminders.push({
          userId: med.userId,
          email,
          medicationId: med.id,
          medName: med.name,
          slotTime,
          type: "pre_dose",
          bucketKey: dateStr,
        });
      }

      if (prefs.overdueEnabled && nowMinutes >= slotMinutes + GRACE_MINUTES) {
        reminders.push({
          userId: med.userId,
          email,
          medicationId: med.id,
          medName: med.name,
          slotTime,
          type: "overdue_hourly",
          bucketKey: `${dateStr}:${hourBucket}`,
        });
      }
    }
  }

  return reminders;
}

export async function processMedicationReminders(now = new Date()) {
  const reminders = await collectReminders(now);
  let emailSent = 0;
  let pushSent = 0;

  for (const r of reminders) {
    const prefs = await getOrCreateNotificationPreferences(r.userId);

    if (prefs.emailReminders && isEmailConfigured()) {
      const notYet = !(await alreadySent(
        r.userId,
        r.type,
        r.medicationId,
        r.slotTime,
        "email",
        r.bucketKey
      ));
      if (notYet) {
        try {
          await sendMedicationReminderEmail(r.email, {
            medName: r.medName,
            slotTime: r.slotTime,
            type: r.type,
          });
          await recordSent(
            r.userId,
            r.type,
            r.medicationId,
            r.slotTime,
            "email",
            r.bucketKey
          );
          emailSent++;
        } catch (e) {
          console.error("med reminder email", e);
        }
      }
    }

    if (prefs.pushReminders && isPushConfigured()) {
      const [hasSub] = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, r.userId))
        .limit(1);

      if (hasSub) {
        const notYet = !(await alreadySent(
          r.userId,
          r.type,
          r.medicationId,
          r.slotTime,
          "push",
          r.bucketKey
        ));
        if (notYet) {
          const title =
            r.type === "pre_dose"
              ? "服薬の予定があります"
              : "服薬の記録をお願いします";
          const body =
            r.type === "pre_dose"
              ? `${r.medName} — ${r.slotTime}の1時間前です`
              : `${r.medName}（${r.slotTime}）の服用を記録してください`;

          const result = await sendPushToUser(r.userId, {
            title,
            body,
            url: "/medications",
          });

          if (result.sent > 0) {
            await recordSent(
              r.userId,
              r.type,
              r.medicationId,
              r.slotTime,
              "push",
              r.bucketKey
            );
            pushSent += result.sent;
          }
        }
      }
    }
  }

  return { processed: reminders.length, emailSent, pushSent };
}
