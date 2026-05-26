import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const transfersRoutes = new Hono<AppEnv>();

transfersRoutes.get('/', async (c) => c.json({ message: 'TODO: list transfers' }, 501));
transfersRoutes.post('/', async (c) => c.json({ message: 'TODO: create transfer' }, 501));
transfersRoutes.get('/:id', async (c) => c.json({ message: 'TODO: get transfer' }, 501));
transfersRoutes.post('/:id/dispatch', async (c) =>
  c.json({ message: 'TODO: dispatch transfer' }, 501),
);
transfersRoutes.post('/:id/receive', async (c) =>
  c.json({ message: 'TODO: receive transfer' }, 501),
);
