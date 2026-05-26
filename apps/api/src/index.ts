import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';

import { authMiddleware } from './middleware/auth';
import { rlsMiddleware } from './middleware/rls';
import { rateLimitMiddleware } from './middleware/rate-limit';

import { authRoutes } from './routes/auth';
import { catalogRoutes } from './routes/catalog';
import { procurementRoutes } from './routes/procurement';
import { inventoryRoutes } from './routes/inventory';
import { warehousingRoutes } from './routes/warehousing';
import { transfersRoutes } from './routes/transfers';
import { salesRoutes } from './routes/sales';
import { costingRoutes } from './routes/costing';
import { aiRoutes } from './routes/ai';
import { billingRoutes } from './routes/billing';

import type { Env } from './lib/env';

export type AppEnv = { Bindings: Env };

const app = new Hono<AppEnv>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: (origin) => origin, // tightened per-env in production
    credentials: true,
  }),
);
app.use('*', rateLimitMiddleware);

// Health check (no auth)
app.get('/health', (c) => c.json({ status: 'ok', ts: Date.now() }));

// Authenticated routes
app.use('/v1/*', authMiddleware);
app.use('/v1/*', rlsMiddleware);

const v1 = app.basePath('/v1');
v1.route('/auth', authRoutes);
v1.route('/catalog', catalogRoutes);
v1.route('/procurement', procurementRoutes);
v1.route('/inventory', inventoryRoutes);
v1.route('/warehousing', warehousingRoutes);
v1.route('/transfers', transfersRoutes);
v1.route('/sales', salesRoutes);
v1.route('/costing', costingRoutes);
v1.route('/ai', aiRoutes);
v1.route('/billing', billingRoutes);

export default app;
