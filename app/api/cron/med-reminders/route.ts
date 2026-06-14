import { NextResponse } from "next/server";
import { processMedicationReminders } from "@/lib/med-reminders";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processMedicationReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("cron/med-reminders", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
