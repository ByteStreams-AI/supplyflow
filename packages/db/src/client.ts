import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

export type DbSchema = typeof schema;
export type Db = ReturnType<typeof createDb>;

/**
 * Create a Drizzle DB instance backed by a pg connection pool.
 *
 * - In Cloudflare Workers use the Supabase **connection pooler** URL
 *   (Transaction mode, port 6543) since Workers have no persistent connections.
 * - In migration scripts / local dev use the direct database URL (port 5432).
 */
export function createDb(connectionString: string): ReturnType<typeof drizzle<DbSchema>> {
  const pool = new Pool({ connectionString, max: 1 });
  return drizzle(pool, { schema });
}
