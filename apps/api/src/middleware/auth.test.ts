import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppEnv } from '../index';
import { authMiddleware, type JwtClaims } from './auth';

const TEST_SECRET = 'test-supabase-jwt-secret';
const TEST_ENV = { SUPABASE_JWT_SECRET: TEST_SECRET } as AppEnv['Bindings'];

function encodeBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function createJwt(claims: JwtClaims, secret = TEST_SECRET): Promise<string> {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify(claims));
  const signingInput = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const signatureB64Url = bytesToBase64Url(new Uint8Array(signature));

  return `${signingInput}.${signatureB64Url}`;
}

function createClaims(): JwtClaims {
  return {
    sub: 'user-1',
    tenant_id: 'tenant-1',
    role: 'owner',
    location_ids: [],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

function createApp() {
  const app = new Hono<AppEnv>();
  app.use('/secure/*', authMiddleware);
  app.get('/secure/ping', (c) => c.json({ ok: true }));
  return app;
}

describe('auth middleware', () => {
  it('accepts a valid signed JWT', async () => {
    const app = createApp();
    const token = await createJwt(createClaims());

    const response = await app.request(
      '/secure/ping',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      TEST_ENV,
    );

    expect(response.status).toBe(200);
  });

  it('returns 401 for malformed base64url payload', async () => {
    const app = createApp();
    const malformedToken = 'abc.@@@@.sig';

    const response = await app.request(
      '/secure/ping',
      {
        headers: { Authorization: `Bearer ${malformedToken}` },
      },
      TEST_ENV,
    );

    expect(response.status).toBe(401);
  });

  it('returns 401 for payloads missing required claims', async () => {
    const app = createApp();
    const now = Math.floor(Date.now() / 1000) + 3600;
    const token = await createJwt({ exp: now } as JwtClaims);

    const response = await app.request(
      '/secure/ping',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      TEST_ENV,
    );

    expect(response.status).toBe(401);
  });
});
