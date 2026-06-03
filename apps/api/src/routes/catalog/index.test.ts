import { Hono } from 'hono';
import type {
  CreateItem,
  CreateMenuItem,
  Item,
  MenuItem,
  UpdateItem,
} from '@supplyflow/types';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AppEnv } from '../../index';
import type { JwtClaims } from '../../middleware/auth';
import { authMiddleware } from '../../middleware/auth';
import { rlsMiddleware } from '../../middleware/rls';
import {
  createCatalogRoutes,
  type CatalogRepository,
  type UpdateMenuItem,
} from './index';

type TenantStore = {
  items: Map<string, Item>;
  menuItems: Map<string, MenuItem>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function createUuid(sequence: number): string {
  return `00000000-0000-4000-8000-${sequence.toString(16).padStart(12, '0')}`;
}

const TEST_JWT_SECRET = 'test-supabase-jwt-secret';
const TEST_ENV = { SUPABASE_JWT_SECRET: TEST_JWT_SECRET } as AppEnv['Bindings'];

function encodeBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function createJwt(claims: JwtClaims, secret = TEST_JWT_SECRET): Promise<string> {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify(claims));
  const signingInput = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const signatureB64Url = bytesToBase64Url(new Uint8Array(signature));

  return `${signingInput}.${signatureB64Url}`;
}

async function requestAsTenant(
  app: ReturnType<typeof createTestApp>,
  tenantId: string,
  path: string,
  init: RequestInit = {},
) {
  const claims: JwtClaims = {
    sub: 'test-user',
    tenant_id: tenantId,
    role: 'owner',
    location_ids: [],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const token = await createJwt(claims);

  return app.request(
    path,
    {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    },
    TEST_ENV,
  );
}

class InMemoryCatalogStore {
  private readonly tenantData = new Map<string, TenantStore>();

  private itemSequence = 0;

  private menuItemSequence = 0;

  private getTenantStore(tenantId: string): TenantStore {
    const existingStore = this.tenantData.get(tenantId);
    if (existingStore) {
      return existingStore;
    }

    const createdStore: TenantStore = {
      items: new Map<string, Item>(),
      menuItems: new Map<string, MenuItem>(),
    };
    this.tenantData.set(tenantId, createdStore);
    return createdStore;
  }

  createRepository(tenantId: string): CatalogRepository {
    const tenantStore = this.getTenantStore(tenantId);

    return {
      listItems: async () => Array.from(tenantStore.items.values()),
      createItem: async (payload: CreateItem) => {
        this.itemSequence += 1;
        const timestamp = nowIso();
        const created: Item = {
          id: createUuid(this.itemSequence),
          tenant_id: tenantId,
          created_at: timestamp,
          updated_at: timestamp,
          ...payload,
        };
        tenantStore.items.set(created.id, created);
        return created;
      },
      getItem: async (itemId: string) => tenantStore.items.get(itemId) ?? null,
      updateItem: async (itemId: string, payload: UpdateItem) => {
        const existing = tenantStore.items.get(itemId);
        if (!existing) {
          return null;
        }

        const updated: Item = {
          ...existing,
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.type !== undefined ? { type: payload.type } : {}),
          ...(payload.category !== undefined ? { category: payload.category } : {}),
          ...(payload.stock_uom !== undefined ? { stock_uom: payload.stock_uom } : {}),
          ...(payload.purchase_uom !== undefined
            ? { purchase_uom: payload.purchase_uom }
            : {}),
          ...(payload.purchase_to_stock_factor !== undefined
            ? { purchase_to_stock_factor: payload.purchase_to_stock_factor }
            : {}),
          ...(payload.storage_zone !== undefined
            ? { storage_zone: payload.storage_zone }
            : {}),
          ...(payload.allergens !== undefined ? { allergens: payload.allergens } : {}),
          ...(payload.image_url !== undefined ? { image_url: payload.image_url } : {}),
          ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
          updated_at: nowIso(),
        };
        tenantStore.items.set(itemId, updated);
        return updated;
      },
      deleteItem: async (itemId: string) => tenantStore.items.delete(itemId),
      listMenuItems: async () => Array.from(tenantStore.menuItems.values()),
      createMenuItem: async (payload: CreateMenuItem) => {
        this.menuItemSequence += 1;
        const timestamp = nowIso();
        const created: MenuItem = {
          id: createUuid(this.menuItemSequence + 10_000),
          tenant_id: tenantId,
          created_at: timestamp,
          updated_at: timestamp,
          ...payload,
        };
        tenantStore.menuItems.set(created.id, created);
        return created;
      },
      getMenuItem: async (menuItemId: string) =>
        tenantStore.menuItems.get(menuItemId) ?? null,
      updateMenuItem: async (menuItemId: string, payload: UpdateMenuItem) => {
        const existing = tenantStore.menuItems.get(menuItemId);
        if (!existing) {
          return null;
        }

        const updated: MenuItem = {
          ...existing,
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.menu_price !== undefined
            ? { menu_price: payload.menu_price }
            : {}),
          ...(payload.target_food_cost_pct !== undefined
            ? { target_food_cost_pct: payload.target_food_cost_pct }
            : {}),
          ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
          updated_at: nowIso(),
        };
        tenantStore.menuItems.set(menuItemId, updated);
        return updated;
      },
    };
  }
}

function createTestApp(store: InMemoryCatalogStore) {
  const app = new Hono<AppEnv>();

  app.use('/v1/*', authMiddleware);
  app.use('/v1/*', rlsMiddleware);

  app.route('/v1/catalog', createCatalogRoutes(async (_c, tenantId) => store.createRepository(tenantId)));

  return app;
}

describe('catalog routes', () => {
  let store: InMemoryCatalogStore;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    store = new InMemoryCatalogStore();
    app = createTestApp(store);
  });

  it('supports item CRUD happy path', async () => {
    const createResponse = await requestAsTenant(app, 'tenant-a', '/v1/catalog/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Tomatoes',
        type: 'raw',
        category: 'produce',
        stock_uom: 'kg',
        purchase_uom: 'case',
        purchase_to_stock_factor: 10,
        storage_zone: 'refrigerated',
        allergens: [],
        image_url: null,
        is_active: true,
      } satisfies CreateItem),
    });

    expect(createResponse.status).toBe(201);
    const createdPayload = (await createResponse.json()) as { data: Item };
    expect(createdPayload.data.name).toBe('Tomatoes');

    const listResponse = await requestAsTenant(app, 'tenant-a', '/v1/catalog/items');
    expect(listResponse.status).toBe(200);
    const listPayload = (await listResponse.json()) as { data: Item[] };
    expect(listPayload.data).toHaveLength(1);

    const updateResponse = await requestAsTenant(
      app,
      'tenant-a',
      `/v1/catalog/items/${createdPayload.data.id}`,
      {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Roma Tomatoes' }),
      },
    );
    expect(updateResponse.status).toBe(200);
    const updatedPayload = (await updateResponse.json()) as { data: Item };
    expect(updatedPayload.data.name).toBe('Roma Tomatoes');

    const deleteResponse = await requestAsTenant(
      app,
      'tenant-a',
      `/v1/catalog/items/${createdPayload.data.id}`,
      { method: 'DELETE' },
    );
    expect(deleteResponse.status).toBe(204);

    const missingResponse = await requestAsTenant(
      app,
      'tenant-a',
      `/v1/catalog/items/${createdPayload.data.id}`,
    );
    expect(missingResponse.status).toBe(404);
  });

  it('enforces tenant isolation for item reads', async () => {
    const createResponse = await requestAsTenant(app, 'tenant-a', '/v1/catalog/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Olive Oil',
        type: 'raw',
        category: 'pantry',
        stock_uom: 'liter',
        purchase_uom: 'jug',
        purchase_to_stock_factor: 3,
        storage_zone: 'dry',
        allergens: [],
        image_url: null,
        is_active: true,
      } satisfies CreateItem),
    });
    const created = (await createResponse.json()) as { data: Item };

    const listTenantB = await requestAsTenant(app, 'tenant-b', '/v1/catalog/items');
    expect(listTenantB.status).toBe(200);
    const tenantBPayload = (await listTenantB.json()) as { data: Item[] };
    expect(tenantBPayload.data).toHaveLength(0);

    const getTenantB = await requestAsTenant(
      app,
      'tenant-b',
      `/v1/catalog/items/${created.data.id}`,
    );
    expect(getTenantB.status).toBe(404);
  });

  it('enforces tenant isolation for item update/delete', async () => {
    const createResponse = await requestAsTenant(app, 'tenant-a', '/v1/catalog/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Mozzarella',
        type: 'raw',
        category: 'dairy',
        stock_uom: 'kg',
        purchase_uom: 'block',
        purchase_to_stock_factor: 1,
        storage_zone: 'refrigerated',
        allergens: ['milk'],
        image_url: null,
        is_active: true,
      } satisfies CreateItem),
    });
    const created = (await createResponse.json()) as { data: Item };

    const updateTenantB = await requestAsTenant(
      app,
      'tenant-b',
      `/v1/catalog/items/${created.data.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Not Yours' }),
      },
    );
    expect(updateTenantB.status).toBe(404);

    const deleteTenantB = await requestAsTenant(
      app,
      'tenant-b',
      `/v1/catalog/items/${created.data.id}`,
      { method: 'DELETE' },
    );
    expect(deleteTenantB.status).toBe(404);
  });

  it('supports menu-item create, list, and update', async () => {
    const createResponse = await requestAsTenant(app, 'tenant-a', '/v1/catalog/menu-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Margherita Pizza',
        menu_price: 18.5,
        target_food_cost_pct: 0.31,
        is_active: true,
      } satisfies CreateMenuItem),
    });
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { data: MenuItem };

    const updateResponse = await requestAsTenant(
      app,
      'tenant-a',
      `/v1/catalog/menu-items/${created.data.id}`,
      {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        menu_price: 19.25,
        target_food_cost_pct: 0.29,
      }),
      },
    );
    expect(updateResponse.status).toBe(200);
    const updated = (await updateResponse.json()) as { data: MenuItem };
    expect(updated.data.menu_price).toBe(19.25);

    const listResponse = await requestAsTenant(app, 'tenant-a', '/v1/catalog/menu-items');
    expect(listResponse.status).toBe(200);
    const listPayload = (await listResponse.json()) as { data: MenuItem[] };
    expect(listPayload.data).toHaveLength(1);
    expect(listPayload.data[0]?.target_food_cost_pct).toBe(0.29);
  });

  it('returns 401 when authorization is missing', async () => {
    const response = await app.request('/v1/catalog/items', { method: 'GET' }, TEST_ENV);
    expect(response.status).toBe(401);
  });

  it('returns 400 for malformed JSON body', async () => {
    const response = await requestAsTenant(app, 'tenant-a', '/v1/catalog/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"name":',
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid UUID parameter', async () => {
    const response = await requestAsTenant(app, 'tenant-a', '/v1/catalog/items/not-a-uuid');
    expect(response.status).toBe(400);
  });

  it('returns 400 for empty item update payload', async () => {
    const createResponse = await requestAsTenant(app, 'tenant-a', '/v1/catalog/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Flour',
        type: 'raw',
        category: 'dry-goods',
        stock_uom: 'kg',
        purchase_uom: 'bag',
        purchase_to_stock_factor: 25,
        storage_zone: 'dry',
        allergens: ['gluten'],
        image_url: null,
        is_active: true,
      } satisfies CreateItem),
    });
    const created = (await createResponse.json()) as { data: Item };

    const updateResponse = await requestAsTenant(
      app,
      'tenant-a',
      `/v1/catalog/items/${created.data.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );

    expect(updateResponse.status).toBe(400);
  });
});
