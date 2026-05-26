import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../index';

export type JwtClaims = {
  sub: string;          // user_id
  tenant_id: string;
  role: string;
  location_ids: string[];
  exp: number;
};

declare module 'hono' {
  interface ContextVariableMap {
    jwtClaims: JwtClaims;
  }
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  // Verify JWT using Supabase JWT secret via Web Crypto API (edge-compatible)
  const [headerB64, payloadB64, sigB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !sigB64) {
    throw new HTTPException(401, { message: 'Malformed JWT' });
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(c.env.SUPABASE_JWT_SECRET);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const sigBuffer = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0),
  );
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBuffer,
    encoder.encode(`${headerB64}.${payloadB64}`),
  );

  if (!valid) {
    throw new HTTPException(401, { message: 'Invalid JWT signature' });
  }

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as JwtClaims;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new HTTPException(401, { message: 'JWT expired' });
  }

  c.set('jwtClaims', payload);
  await next();
});
