import { and, desc, eq } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import { schema, setRlsToken } from '@supplyflow/db';
import {
  CreateItemSchema,
  CreateMenuItemSchema,
  UpdateItemSchema,
  UuidSchema,
  type CreateItem,
  type CreateMenuItem,
  type Item,
  type MenuItem,
  type UpdateItem,
} from '@supplyflow/types';
import { z } from 'zod';
import type { AppEnv } from '../../index';
import { createWorkerDb } from '../../lib/db';

const UpdateMenuItemSchema = CreateMenuItemSchema.partial();
export type UpdateMenuItem = z.infer<typeof UpdateMenuItemSchema>;

const NonEmptyUpdateItemSchema = UpdateItemSchema.refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one field must be provided for update.' },
);

const NonEmptyUpdateMenuItemSchema = UpdateMenuItemSchema.refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one field must be provided for update.' },
);

type ItemRow = typeof schema.item.$inferSelect;
type MenuItemRow = typeof schema.menuItem.$inferSelect;
type ItemInsert = typeof schema.item.$inferInsert;
type MenuItemInsert = typeof schema.menuItem.$inferInsert;

export type CatalogRepository = {
  listItems: () => Promise<Item[]>;
  createItem: (payload: CreateItem) => Promise<Item>;
  getItem: (itemId: string) => Promise<Item | null>;
  updateItem: (itemId: string, payload: UpdateItem) => Promise<Item | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
  listMenuItems: () => Promise<MenuItem[]>;
  createMenuItem: (payload: CreateMenuItem) => Promise<MenuItem>;
  getMenuItem: (menuItemId: string) => Promise<MenuItem | null>;
  updateMenuItem: (menuItemId: string, payload: UpdateMenuItem) => Promise<MenuItem | null>;
};

type CatalogRepositoryFactory = (
  c: Context<AppEnv>,
  tenantId: string,
) => Promise<CatalogRepository>;

type ParseResult<T> = { ok: true; value: T } | { ok: false; response: Response };

const defaultCatalogRepositoryFactory: CatalogRepositoryFactory = async (
  c,
  tenantId,
) => {
  const db = createWorkerDb(c.env);
  await setRlsToken(db, c.get('rlsToken'));

  return {
    listItems: async () => {
      const rows = await db
        .select()
        .from(schema.item)
        .where(eq(schema.item.tenant_id, tenantId))
        .orderBy(desc(schema.item.created_at));
      return rows.map(toApiItem);
    },
    createItem: async (payload) => {
      const [created] = await db
        .insert(schema.item)
        .values(toDbItemInsertValues(tenantId, payload))
        .returning();
      if (!created) {
        throw new Error('Failed to create item.');
      }
      return toApiItem(created);
    },
    getItem: async (itemId) => {
      const [found] = await db
        .select()
        .from(schema.item)
        .where(and(eq(schema.item.id, itemId), eq(schema.item.tenant_id, tenantId)))
        .limit(1);
      return found ? toApiItem(found) : null;
    },
    updateItem: async (itemId, payload) => {
      const updateValues = toDbItemUpdateValues(payload);
      const [updated] = await db
        .update(schema.item)
        .set({ ...updateValues, updated_at: new Date() })
        .where(and(eq(schema.item.id, itemId), eq(schema.item.tenant_id, tenantId)))
        .returning();
      return updated ? toApiItem(updated) : null;
    },
    deleteItem: async (itemId) => {
      const deletedRows = await db
        .delete(schema.item)
        .where(and(eq(schema.item.id, itemId), eq(schema.item.tenant_id, tenantId)))
        .returning({ id: schema.item.id });
      return deletedRows.length > 0;
    },
    listMenuItems: async () => {
      const rows = await db
        .select()
        .from(schema.menuItem)
        .where(eq(schema.menuItem.tenant_id, tenantId))
        .orderBy(desc(schema.menuItem.created_at));
      return rows.map(toApiMenuItem);
    },
    createMenuItem: async (payload) => {
      const [created] = await db
        .insert(schema.menuItem)
        .values(toDbMenuItemInsertValues(tenantId, payload))
        .returning();
      if (!created) {
        throw new Error('Failed to create menu item.');
      }
      return toApiMenuItem(created);
    },
    getMenuItem: async (menuItemId) => {
      const [found] = await db
        .select()
        .from(schema.menuItem)
        .where(
          and(
            eq(schema.menuItem.id, menuItemId),
            eq(schema.menuItem.tenant_id, tenantId),
          ),
        )
        .limit(1);
      return found ? toApiMenuItem(found) : null;
    },
    updateMenuItem: async (menuItemId, payload) => {
      const updateValues = toDbMenuItemUpdateValues(payload);
      const [updated] = await db
        .update(schema.menuItem)
        .set({ ...updateValues, updated_at: new Date() })
        .where(
          and(
            eq(schema.menuItem.id, menuItemId),
            eq(schema.menuItem.tenant_id, tenantId),
          ),
        )
        .returning();
      return updated ? toApiMenuItem(updated) : null;
    },
  };
};

export function createCatalogRoutes(
  repositoryFactory: CatalogRepositoryFactory = defaultCatalogRepositoryFactory,
) {
  const routes = new Hono<AppEnv>();

  routes.get('/items', async (c) => {
    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const items = await repository.listItems();
    return c.json({ data: items });
  });

  routes.post('/items', async (c) => {
    const parsedBody = await parseBody(c, CreateItemSchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const created = await repository.createItem(parsedBody.value);
    return c.json({ data: created }, 201);
  });

  routes.get('/items/:id', async (c) => {
    const parsedId = parseUuidParam(c, 'id');
    if (!parsedId.ok) {
      return parsedId.response;
    }

    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const found = await repository.getItem(parsedId.value);
    if (!found) {
      return c.json({ error: 'Item not found.' }, 404);
    }

    return c.json({ data: found });
  });

  routes.put('/items/:id', async (c) => {
    const parsedId = parseUuidParam(c, 'id');
    if (!parsedId.ok) {
      return parsedId.response;
    }

    const parsedBody = await parseBody(c, NonEmptyUpdateItemSchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const updated = await repository.updateItem(parsedId.value, parsedBody.value);
    if (!updated) {
      return c.json({ error: 'Item not found.' }, 404);
    }

    return c.json({ data: updated });
  });

  routes.delete('/items/:id', async (c) => {
    const parsedId = parseUuidParam(c, 'id');
    if (!parsedId.ok) {
      return parsedId.response;
    }

    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const deleted = await repository.deleteItem(parsedId.value);
    if (!deleted) {
      return c.json({ error: 'Item not found.' }, 404);
    }

    return c.body(null, 204);
  });

  routes.get('/menu-items', async (c) => {
    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const menuItems = await repository.listMenuItems();
    return c.json({ data: menuItems });
  });

  routes.post('/menu-items', async (c) => {
    const parsedBody = await parseBody(c, CreateMenuItemSchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const created = await repository.createMenuItem(parsedBody.value);
    return c.json({ data: created }, 201);
  });

  routes.get('/menu-items/:id', async (c) => {
    const parsedId = parseUuidParam(c, 'id');
    if (!parsedId.ok) {
      return parsedId.response;
    }

    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const found = await repository.getMenuItem(parsedId.value);
    if (!found) {
      return c.json({ error: 'Menu item not found.' }, 404);
    }

    return c.json({ data: found });
  });

  routes.put('/menu-items/:id', async (c) => {
    const parsedId = parseUuidParam(c, 'id');
    if (!parsedId.ok) {
      return parsedId.response;
    }

    const parsedBody = await parseBody(c, NonEmptyUpdateMenuItemSchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const repository = await repositoryFactory(c, c.get('jwtClaims').tenant_id);
    const updated = await repository.updateMenuItem(parsedId.value, parsedBody.value);
    if (!updated) {
      return c.json({ error: 'Menu item not found.' }, 404);
    }

    return c.json({ data: updated });
  });

  // BOM
  routes.get('/menu-items/:id/bom', async (c) => c.json({ message: 'TODO: get BOM' }, 501));
  routes.put('/menu-items/:id/bom', async (c) =>
    c.json({ message: 'TODO: update BOM' }, 501),
  );
  routes.get('/menu-items/:id/bom/explosion', async (c) =>
    c.json({ message: 'TODO: BOM explosion' }, 501),
  );

  return routes;
}

function toApiItem(row: ItemRow): Item {
  return {
    ...row,
    purchase_to_stock_factor: Number(row.purchase_to_stock_factor),
    created_at: serializeDate(row.created_at),
    updated_at: serializeDate(row.updated_at),
  };
}

function toApiMenuItem(row: MenuItemRow): MenuItem {
  return {
    ...row,
    menu_price: Number(row.menu_price),
    target_food_cost_pct: Number(row.target_food_cost_pct),
    created_at: serializeDate(row.created_at),
    updated_at: serializeDate(row.updated_at),
  };
}

function toDbItemInsertValues(tenantId: string, payload: CreateItem): ItemInsert {
  return {
    tenant_id: tenantId,
    name: payload.name,
    type: payload.type,
    category: payload.category,
    stock_uom: payload.stock_uom,
    purchase_uom: payload.purchase_uom,
    purchase_to_stock_factor: payload.purchase_to_stock_factor.toString(),
    storage_zone: payload.storage_zone,
    allergens: payload.allergens,
    image_url: payload.image_url,
    is_active: payload.is_active,
  };
}

function toDbItemUpdateValues(payload: UpdateItem): Partial<ItemInsert> {
  const updateValues: Partial<ItemInsert> = {};
  if (payload.name !== undefined) updateValues.name = payload.name;
  if (payload.type !== undefined) updateValues.type = payload.type;
  if (payload.category !== undefined) updateValues.category = payload.category;
  if (payload.stock_uom !== undefined) updateValues.stock_uom = payload.stock_uom;
  if (payload.purchase_uom !== undefined) updateValues.purchase_uom = payload.purchase_uom;
  if (payload.purchase_to_stock_factor !== undefined) {
    updateValues.purchase_to_stock_factor = payload.purchase_to_stock_factor.toString();
  }
  if (payload.storage_zone !== undefined) updateValues.storage_zone = payload.storage_zone;
  if (payload.allergens !== undefined) updateValues.allergens = payload.allergens;
  if (payload.image_url !== undefined) updateValues.image_url = payload.image_url;
  if (payload.is_active !== undefined) updateValues.is_active = payload.is_active;
  return updateValues;
}

function toDbMenuItemInsertValues(
  tenantId: string,
  payload: CreateMenuItem,
): MenuItemInsert {
  return {
    tenant_id: tenantId,
    name: payload.name,
    menu_price: payload.menu_price.toString(),
    target_food_cost_pct: payload.target_food_cost_pct.toString(),
    is_active: payload.is_active,
  };
}

function toDbMenuItemUpdateValues(payload: UpdateMenuItem): Partial<MenuItemInsert> {
  const updateValues: Partial<MenuItemInsert> = {};
  if (payload.name !== undefined) updateValues.name = payload.name;
  if (payload.menu_price !== undefined) {
    updateValues.menu_price = payload.menu_price.toString();
  }
  if (payload.target_food_cost_pct !== undefined) {
    updateValues.target_food_cost_pct = payload.target_food_cost_pct.toString();
  }
  if (payload.is_active !== undefined) updateValues.is_active = payload.is_active;
  return updateValues;
}

function serializeDate(value: Date): string {
  return value.toISOString();
}

async function parseBody<T extends z.ZodTypeAny>(
  c: Context<AppEnv>,
  schemaToApply: T,
): Promise<ParseResult<z.infer<T>>> {
  let json: unknown;
  try {
    json = await c.req.json();
  } catch {
    return { ok: false, response: c.json({ error: 'Request body must be valid JSON.' }, 400) };
  }

  const parsed = schemaToApply.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json(
        { error: 'Invalid request payload.', details: parsed.error.flatten() },
        400,
      ),
    };
  }

  return { ok: true, value: parsed.data };
}

function parseUuidParam(c: Context<AppEnv>, paramName: string): ParseResult<string> {
  const parsed = UuidSchema.safeParse(c.req.param(paramName));
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json({ error: `${paramName} must be a valid UUID.` }, 400),
    };
  }

  return { ok: true, value: parsed.data };
}

export const catalogRoutes = createCatalogRoutes();
