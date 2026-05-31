import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { medications } from "@/lib/db/schema";

const medSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  scheduleTimes: z.array(z.string()).min(1),
  foodTiming: z.enum(["before_meal", "after_meal", "empty_stomach", "any"]),
  contraindications: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = medSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が無効です" }, { status: 400 });
  }

  const [updated] = await db
    .update(medications)
    .set(parsed.data)
    .where(
      and(eq(medications.id, id), eq(medications.userId, authResult.userId))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  await db
    .delete(medications)
    .where(
      and(eq(medications.id, id), eq(medications.userId, authResult.userId))
    );

  return NextResponse.json({ ok: true });
}
