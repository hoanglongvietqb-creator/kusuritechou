import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { foodPresets } from "@/lib/db/schema";

export async function GET() {
  const presets = await db.select().from(foodPresets).orderBy(foodPresets.nameJa);
  return NextResponse.json(presets);
}
