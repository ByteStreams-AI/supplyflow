import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const catalogRoutes = new Hono<AppEnv>();

// Items
catalogRoutes.get('/items', async (c) => c.json({ message: 'TODO: list items' }, 501));
catalogRoutes.post('/items', async (c) => c.json({ message: 'TODO: create item' }, 501));
catalogRoutes.get('/items/:id', async (c) => c.json({ message: 'TODO: get item' }, 501));
catalogRoutes.put('/items/:id', async (c) => c.json({ message: 'TODO: update item' }, 501));
catalogRoutes.delete('/items/:id', async (c) => c.json({ message: 'TODO: delete item' }, 501));

// Menu items
catalogRoutes.get('/menu-items', async (c) => c.json({ message: 'TODO: list menu items' }, 501));
catalogRoutes.post('/menu-items', async (c) => c.json({ message: 'TODO: create menu item' }, 501));
catalogRoutes.get('/menu-items/:id', async (c) => c.json({ message: 'TODO: get menu item' }, 501));
catalogRoutes.put('/menu-items/:id', async (c) =>
  c.json({ message: 'TODO: update menu item' }, 501),
);

// BOM
catalogRoutes.get('/menu-items/:id/bom', async (c) =>
  c.json({ message: 'TODO: get BOM' }, 501),
);
catalogRoutes.put('/menu-items/:id/bom', async (c) =>
  c.json({ message: 'TODO: update BOM' }, 501),
);
catalogRoutes.get('/menu-items/:id/bom/explosion', async (c) =>
  c.json({ message: 'TODO: BOM explosion' }, 501),
);
