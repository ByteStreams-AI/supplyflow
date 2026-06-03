import { sql } from 'drizzle-orm';
import type { Db } from './client.js';

/**
 * Set the Postgres session variable `request.jwt` so that RLS policies
 * referencing `auth.jwt()` have access to the current user's JWT claims.
 *
 * Call this once per request, immediately after obtaining a DB connection,
 * before executing any tenant-scoped query.
 *
 * The `local` flag (third arg to set_config) scopes the change to the current
 * transaction only, which is appropriate for Supabase pooler transaction mode.
 */
export async function setRlsToken(db: Db, jwt: string): Promise<void> {
  await db.execute(sql`SELECT set_config('request.jwt', ${jwt}, true)`);
}

/**
 * Run a callback inside a transaction with the RLS JWT already set.
 * Ensures the session claim is scoped to the transaction.
 */
export async function withRls<T>(
  db: Db,
  jwt: string,
  fn: (tx: Db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('request.jwt', ${jwt}, true)`);
    return fn(tx as unknown as Db);
  });
}
