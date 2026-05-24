/**
 * サーバーメモリ上のシンプルなレートリミッター。
 * サーバー再起動でリセットされるが、個人〜小規模公開用途では十分。
 */

interface RateRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateRecord>();

// 期限切れエントリを1時間ごとに掃除してメモリリークを防ぐ
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) store.delete(key);
  }
}, 60 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * @param identifier  IPアドレスなどの識別子
 * @param limit       ウィンドウ内の最大リクエスト数
 * @param windowMs    ウィンドウの長さ（ミリ秒）
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  return { allowed: true };
}

/** リクエストからクライアントIPを取得する */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
