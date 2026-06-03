import type {
  CreateItem,
  CreateMenuItem,
  Item,
  MenuItem,
  UpdateItem,
} from '@supplyflow/types';

type ApiResponse<T> = {
  data: T;
};

type UpdateMenuItem = Partial<CreateMenuItem>;

const CATALOG_BASE_PATH = '/v1/catalog';

function buildAuthHeaders(token: string): Record<string, string> {
  if (!token.trim()) {
    return {};
  }

  return { Authorization: `Bearer ${token.trim()}` };
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  token: string,
): Promise<T> {
  const response = await fetch(`${CATALOG_BASE_PATH}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorPayload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorPayload.error ?? errorPayload.message ?? message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function listItems(token: string): Promise<Item[]> {
  const response = await requestJson<ApiResponse<Item[]>>('/items', { method: 'GET' }, token);
  return response.data;
}

export async function createItem(token: string, payload: CreateItem): Promise<Item> {
  const response = await requestJson<ApiResponse<Item>>(
    '/items',
    { method: 'POST', body: JSON.stringify(payload) },
    token,
  );
  return response.data;
}

export async function updateItem(
  token: string,
  itemId: string,
  payload: UpdateItem,
): Promise<Item> {
  const response = await requestJson<ApiResponse<Item>>(
    `/items/${itemId}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token,
  );
  return response.data;
}

export async function listMenuItems(token: string): Promise<MenuItem[]> {
  const response = await requestJson<ApiResponse<MenuItem[]>>(
    '/menu-items',
    { method: 'GET' },
    token,
  );
  return response.data;
}

export async function createMenuItem(
  token: string,
  payload: CreateMenuItem,
): Promise<MenuItem> {
  const response = await requestJson<ApiResponse<MenuItem>>(
    '/menu-items',
    { method: 'POST', body: JSON.stringify(payload) },
    token,
  );
  return response.data;
}

export async function updateMenuItem(
  token: string,
  menuItemId: string,
  payload: UpdateMenuItem,
): Promise<MenuItem> {
  const response = await requestJson<ApiResponse<MenuItem>>(
    `/menu-items/${menuItemId}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token,
  );
  return response.data;
}
