const forgotLimits = new Map<string, { count: number; resetAt: number }>();

const FORGOT_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function checkForgotRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = forgotLimits.get(key);

  if (!entry || now > entry.resetAt) {
    forgotLimits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= FORGOT_LIMIT) {
    return false;
  }

  entry.count += 1;
  return true;
}
