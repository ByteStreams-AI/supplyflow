import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../index';

/**
 * Sliding-window rate limiter backed by Cloudflare KV.
 * Limit: 300 requests per minute per user_id.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 300;

export const rateLimitMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const claims = c.get('jwtClaims');
  if (!claims) {
    // Not yet authenticated — rate-limit by IP
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    await checkLimit(c.env.RATE_LIMIT_KV, `ip:${ip}`);
  } else {
    await checkLimit(c.env.RATE_LIMIT_KV, `user:${claims.sub}`);
  }
  await next();
});

async function checkLimit(kv: KVNamespace, key: string) {
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / WINDOW_MS)}`;

  const current = parseInt((await kv.get(windowKey)) ?? '0', 10);
  if (current >= MAX_REQUESTS) {
    throw new HTTPException(429, { message: 'Rate limit exceeded' });
  }

  await kv.put(windowKey, String(current + 1), { expirationTtl: 120 });
}
