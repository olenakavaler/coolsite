interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Use globalThis to persist across hot reloads in development
const g = globalThis as unknown as {
  __rateLimitStore?: Map<string, RateLimitEntry>;
  __rateLimitCleanup?: ReturnType<typeof setInterval>;
};

const store: Map<string, RateLimitEntry> =
  g.__rateLimitStore ?? (g.__rateLimitStore = new Map());

// Clean up expired entries every 60 seconds
if (!g.__rateLimitCleanup) {
  g.__rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) {
        store.delete(key);
      }
    }
  }, 60_000);
  if (g.__rateLimitCleanup.unref) g.__rateLimitCleanup.unref();
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}
