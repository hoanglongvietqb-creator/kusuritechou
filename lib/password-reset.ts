import "server-only";
import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";

const TOKEN_BYTES = 32;
const EXPIRY_MS = 60 * 60 * 1000;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const plain = generateResetToken();
  const tokenHash = hashResetToken(plain);
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return plain;
}

export async function findUserByResetToken(
  plainToken: string
): Promise<{ userId: string; tokenId: string } | null> {
  const tokenHash = hashResetToken(plainToken);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    return null;
  }

  return { userId: row.userId, tokenId: row.id };
}

export async function deleteResetToken(tokenId: string) {
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenId));
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return user ?? null;
}
