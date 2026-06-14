const chatLimits = new Map<string, { count: number; resetAt: number }>();
const photoLimits = new Map<string, { count: number; resetAt: number }>();

const CHAT_LIMIT = 20;
const PHOTO_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

export function checkChatRateLimit(userId: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = chatLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    chatLimits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: CHAT_LIMIT - 1 };
  }

  if (entry.count >= CHAT_LIMIT) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: CHAT_LIMIT - entry.count };
}

export function checkPhotoRateLimit(userId: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = photoLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    photoLimits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: PHOTO_LIMIT - 1 };
  }

  if (entry.count >= PHOTO_LIMIT) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: PHOTO_LIMIT - entry.count };
}
