import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const salesRoutes = new Hono<AppEnv>();

// DialTone webhook — ingest sale events and trigger BOM depletion
salesRoutes.post('/dialtone/webhook', async (c) =>
  c.json({ message: 'TODO: DialTone webhook ingestion' }, 501),
);

salesRoutes.get('/orders', async (c) => c.json({ message: 'TODO: list sales orders' }, 501));
salesRoutes.get('/orders/:id', async (c) => c.json({ message: 'TODO: get sales order' }, 501));

// Channel mappings (sales item → menu item)
salesRoutes.get('/channel-map', async (c) => c.json({ message: 'TODO: get channel map' }, 501));
salesRoutes.post('/channel-map', async (c) =>
  c.json({ message: 'TODO: upsert channel map' }, 501),
);
