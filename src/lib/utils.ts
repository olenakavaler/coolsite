/**
 * Validate redirect target to prevent open redirect.
 * Accepts only relative paths that start with a single '/'.
 */
export function safeRedirect(
  next: string | null | undefined,
  defaultPath: string = '/',
): string {
  if (!next || typeof next !== 'string') return defaultPath;
  if (!next.startsWith('/') || next.startsWith('//')) return defaultPath;
  if (next.includes('://')) return defaultPath;
  return next;
}

/**
 * Escape special characters for SQL LIKE patterns.
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}

/**
 * Extract client IP from request headers (for rate limiting).
 */
export function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return headersList.get('x-real-ip') || 'unknown';
}
