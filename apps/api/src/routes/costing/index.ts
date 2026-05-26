import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const costingRoutes = new Hono<AppEnv>();

costingRoutes.get('/plate-cost/:menuItemId', async (c) =>
  c.json({ message: 'TODO: get plate cost' }, 501),
);
costingRoutes.post('/snapshot', async (c) =>
  c.json({ message: 'TODO: trigger cost snapshot' }, 501),
);
costingRoutes.get('/snapshots', async (c) =>
  c.json({ message: 'TODO: list cost snapshots' }, 501),
);
