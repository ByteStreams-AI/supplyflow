import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const aiRoutes = new Hono<AppEnv>();

// Insight alerts
aiRoutes.get('/alerts', async (c) => c.json({ message: 'TODO: list insight alerts' }, 501));
aiRoutes.post('/alerts/:id/dismiss', async (c) =>
  c.json({ message: 'TODO: dismiss alert' }, 501),
);

// Forecasts
aiRoutes.get('/forecasts/:locationId', async (c) =>
  c.json({ message: 'TODO: get forecasts' }, 501),
);

// LLM proxy — Claude-powered insights
aiRoutes.post('/insights', async (c) => c.json({ message: 'TODO: generate insight' }, 501));

// Invoice extraction (Claude vision)
aiRoutes.post('/extract-invoice', async (c) =>
  c.json({ message: 'TODO: extract invoice' }, 501),
);
