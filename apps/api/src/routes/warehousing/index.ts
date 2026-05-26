import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const warehousingRoutes = new Hono<AppEnv>();

warehousingRoutes.get('/storage-areas', async (c) =>
  c.json({ message: 'TODO: list storage areas' }, 501),
);
warehousingRoutes.post('/storage-areas', async (c) =>
  c.json({ message: 'TODO: create storage area' }, 501),
);
warehousingRoutes.post('/receiving', async (c) =>
  c.json({ message: 'TODO: create goods receipt' }, 501),
);
warehousingRoutes.get('/receiving', async (c) =>
  c.json({ message: 'TODO: list goods receipts' }, 501),
);
warehousingRoutes.post('/picking', async (c) =>
  c.json({ message: 'TODO: create pick list' }, 501),
);
