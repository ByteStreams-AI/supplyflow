import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const inventoryRoutes = new Hono<AppEnv>();

inventoryRoutes.get('/stock-levels', async (c) =>
  c.json({ message: 'TODO: list stock levels' }, 501),
);
inventoryRoutes.get('/stock-levels/:itemId', async (c) =>
  c.json({ message: 'TODO: get stock level' }, 501),
);
inventoryRoutes.post('/transactions', async (c) =>
  c.json({ message: 'TODO: post inventory transaction' }, 501),
);
inventoryRoutes.get('/transactions', async (c) =>
  c.json({ message: 'TODO: list transactions' }, 501),
);
inventoryRoutes.post('/counts', async (c) =>
  c.json({ message: 'TODO: start stock count' }, 501),
);
inventoryRoutes.post('/counts/:id/submit', async (c) =>
  c.json({ message: 'TODO: submit count' }, 501),
);
