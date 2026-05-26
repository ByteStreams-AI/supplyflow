import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../index';

/**
 * Sets the Supabase JWT as a Postgres session variable so that RLS policies
 * can read tenant_id and location_ids from auth.jwt() claims.
 *
 * The actual SET happens inside packages/db when a query is executed.
 * This middleware just attaches the raw token to the request context.
 */
export const rlsMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.slice(7) ?? '';
  c.set('rlsToken' as never, token);
  await next();
});
