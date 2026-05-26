import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const procurementRoutes = new Hono<AppEnv>();

// Vendors
procurementRoutes.get('/vendors', async (c) => c.json({ message: 'TODO: list vendors' }, 501));
procurementRoutes.post('/vendors', async (c) => c.json({ message: 'TODO: create vendor' }, 501));
procurementRoutes.get('/vendors/:id', async (c) => c.json({ message: 'TODO: get vendor' }, 501));
procurementRoutes.put('/vendors/:id', async (c) => c.json({ message: 'TODO: update vendor' }, 501));

// Vendor products
procurementRoutes.get('/vendor-products', async (c) =>
  c.json({ message: 'TODO: list vendor products' }, 501),
);
procurementRoutes.post('/vendor-products', async (c) =>
  c.json({ message: 'TODO: create vendor product' }, 501),
);
procurementRoutes.put('/vendor-products/:id', async (c) =>
  c.json({ message: 'TODO: update vendor product' }, 501),
);

// Purchase Orders
procurementRoutes.get('/purchase-orders', async (c) =>
  c.json({ message: 'TODO: list POs' }, 501),
);
procurementRoutes.post('/purchase-orders', async (c) =>
  c.json({ message: 'TODO: create PO' }, 501),
);
procurementRoutes.get('/purchase-orders/:id', async (c) =>
  c.json({ message: 'TODO: get PO' }, 501),
);
procurementRoutes.post('/purchase-orders/:id/submit', async (c) =>
  c.json({ message: 'TODO: submit PO for approval' }, 501),
);
procurementRoutes.post('/purchase-orders/:id/approve', async (c) =>
  c.json({ message: 'TODO: approve PO' }, 501),
);
procurementRoutes.post('/purchase-orders/:id/send', async (c) =>
  c.json({ message: 'TODO: send PO to vendor' }, 501),
);

// Suggestions
procurementRoutes.get('/suggestions', async (c) =>
  c.json({ message: 'TODO: reorder suggestions' }, 501),
);
