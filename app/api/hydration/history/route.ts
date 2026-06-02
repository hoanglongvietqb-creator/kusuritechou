import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { getHydrationHistory } from "@/lib/hydration-stats";

const querySchema = z.enum(["week", "month"]);

export async function GET(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get("range") ?? "week";
  const parsed = querySchema.safeParse(rangeParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "rangeは week または month" }, { status: 400 });
  }

  const history = await getHydrationHistory(authResult.userId, parsed.data);
  return NextResponse.json(history);
}
