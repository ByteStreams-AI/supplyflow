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

  const sigBuffer = decodeBase64UrlToBytes(sigB64);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBuffer,
    encoder.encode(`${headerB64}.${payloadB64}`),
  );

  if (!valid) {
    throw new HTTPException(401, { message: 'Invalid JWT signature' });
  }

  const payload = parseJwtPayload(payloadB64);

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new HTTPException(401, { message: 'JWT expired' });
  }

  c.set('jwtClaims', payload);
  await next();
});

function decodeBase64UrlToBytes(base64Url: string): Uint8Array {
  const normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  let decoded: string;
  try {
    decoded = atob(padded);
  } catch {
    throw new HTTPException(401, { message: 'Malformed JWT' });
  }

  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function parseJwtPayload(payloadB64: string): JwtClaims {
  const payloadBytes = decodeBase64UrlToBytes(payloadB64);
  let payloadText: string;
  try {
    payloadText = new TextDecoder().decode(payloadBytes);
  } catch {
    throw new HTTPException(401, { message: 'Malformed JWT payload' });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    throw new HTTPException(401, { message: 'Malformed JWT payload' });
  }

  if (!isJwtClaims(payload)) {
    throw new HTTPException(401, { message: 'Invalid JWT claims' });
  }

  return payload;
}

function isJwtClaims(value: unknown): value is JwtClaims {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const claims = value as Partial<JwtClaims>;
  return (
    typeof claims.sub === 'string' &&
    typeof claims.tenant_id === 'string' &&
    typeof claims.role === 'string' &&
    Array.isArray(claims.location_ids) &&
    claims.location_ids.every((locationId) => typeof locationId === 'string') &&
    typeof claims.exp === 'number' &&
    Number.isFinite(claims.exp)
  );
}
