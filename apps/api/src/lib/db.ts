/**
 * Drizzle DB client factory for Cloudflare Workers.
 *
 * Workers don't support persistent TCP connections, so we use the Supabase
 * connection **pooler** URL (Transaction mode, port 6543) together with a
 * pool size of 1. A new client is created per-request inside the request
 * handler — there is no module-level singleton.
 *
 * Usage (inside a Hono route handler):
 *
 *   const db = createWorkerDb(c.env);
 *   await setRlsToken(db, c.get('rlsToken'));
 *   const rows = await db.select().from(schema.item)...
 */

import { createDb, type Db } from '@supplyflow/db';
import type { Env } from './env.js';

export type WorkerDb = Db;

export function createWorkerDb(env: Env): WorkerDb {
  return createDb(env.SUPABASE_DB_URL);
}
