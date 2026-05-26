import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const billingRoutes = new Hono<AppEnv>();

// Stripe webhook (no auth middleware — uses Stripe signature verification)
billingRoutes.post('/webhook', async (c) =>
  c.json({ message: 'TODO: Stripe webhook handler' }, 501),
);

billingRoutes.get('/plan', async (c) => c.json({ message: 'TODO: get current plan' }, 501));
billingRoutes.post('/portal', async (c) =>
  c.json({ message: 'TODO: create billing portal session' }, 501),
);
