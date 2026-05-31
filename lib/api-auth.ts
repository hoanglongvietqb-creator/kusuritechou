import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: NextResponse.json({ error: "認証が必要です" }, { status: 401 }) };
  }
  return { userId };
}
