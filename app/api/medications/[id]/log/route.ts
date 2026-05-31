import { NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { medications, medLogs } from "@/lib/db/schema";

const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { id: medicationId } = await params;

  const [med] = await db
    .select()
    .from(medications)
    .where(
      and(
        eq(medications.id, medicationId),
        eq(medications.userId, authResult.userId)
      )
    )
    .limit(1);

  if (!med) {
    return NextResponse.json({ error: "薬が見つかりません" }, { status: 404 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - DUPLICATE_WINDOW_MS);
  const windowEnd = new Date(now.getTime() + DUPLICATE_WINDOW_MS);

  const recent = await db
    .select()
    .from(medLogs)
    .where(
      and(
        eq(medLogs.medicationId, medicationId),
        eq(medLogs.userId, authResult.userId),
        gte(medLogs.takenAt, windowStart),
        lte(medLogs.takenAt, windowEnd)
      )
    )
    .limit(1);

  if (recent.length > 0) {
    return NextResponse.json(
      {
        error: "duplicate",
        message: "30分以内に既に記録されています。重複服用に注意してください。",
        lastTakenAt: recent[0].takenAt,
      },
      { status: 409 }
    );
  }

  const [log] = await db
    .insert(medLogs)
    .values({
      userId: authResult.userId,
      medicationId,
      takenAt: now,
    })
    .returning();

  return NextResponse.json(log, { status: 201 });
}
