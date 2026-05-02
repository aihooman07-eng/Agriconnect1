type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export function slidingWindowHit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (bucket.count < limit) {
    bucket.count += 1;
    return { ok: true, retryAfterMs: 0 };
  }

  return { ok: false, retryAfterMs: bucket.resetAt - now };
}

export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((x) => x.trim());
    if (parts[0]?.length) return parts[0]!;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
