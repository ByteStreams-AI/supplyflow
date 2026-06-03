import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@supplyflow/ui';
import type { CreateItem, CreateMenuItem, Item, MenuItem, UpdateItem } from '@supplyflow/types';
import {
  createItem,
  createMenuItem,
  listItems,
  listMenuItems,
  updateItem,
  updateMenuItem,
} from './lib/catalog-api';

type ActiveView = 'items' | 'menu-items';

type ItemFormState = {
  name: string;
  type: CreateItem['type'];
  category: string;
  stock_uom: string;
  purchase_uom: string;
  purchase_to_stock_factor: string;
  storage_zone: CreateItem['storage_zone'];
  allergensCsv: string;
  image_url: string;
  is_active: boolean;
};

type MenuItemFormState = {
  name: string;
  menu_price: string;
  target_food_cost_pct: string;
  is_active: boolean;
};

const DEFAULT_ITEM_FORM: ItemFormState = {
  name: '',
  type: 'raw',
  category: '',
  stock_uom: 'each',
  purchase_uom: 'case',
  purchase_to_stock_factor: '1',
  storage_zone: 'dry',
  allergensCsv: '',
  image_url: '',
  is_active: true,
};

const DEFAULT_MENU_ITEM_FORM: MenuItemFormState = {
  name: '',
  menu_price: '0',
  target_food_cost_pct: '0.30',
  is_active: true,
};

export function App() {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('items');
  const [itemForm, setItemForm] = useState<ItemFormState>(DEFAULT_ITEM_FORM);
  const [menuItemForm, setMenuItemForm] = useState<MenuItemFormState>(DEFAULT_MENU_ITEM_FORM);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  const [menuItemFormError, setMenuItemFormError] = useState<string | null>(null);

  const tokenReady = accessToken.trim().length > 0;

  const itemsQuery = useQuery({
    queryKey: ['catalog-items', accessToken],
    queryFn: () => listItems(accessToken),
    enabled: tokenReady,
  });

  const menuItemsQuery = useQuery({
    queryKey: ['catalog-menu-items', accessToken],
    queryFn: () => listMenuItems(accessToken),
    enabled: tokenReady,
  });

  const createItemMutation = useMutation({
    mutationFn: (payload: CreateItem) => createItem(accessToken, payload),
    onSuccess: async () => {
      setItemForm(DEFAULT_ITEM_FORM);
      await queryClient.invalidateQueries({ queryKey: ['catalog-items', accessToken] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateItem }) =>
      updateItem(accessToken, itemId, payload),
    onSuccess: async () => {
      setEditingItem(null);
      await queryClient.invalidateQueries({ queryKey: ['catalog-items', accessToken] });
    },
  });

  const createMenuItemMutation = useMutation({
    mutationFn: (payload: CreateMenuItem) => createMenuItem(accessToken, payload),
    onSuccess: async () => {
      setMenuItemForm(DEFAULT_MENU_ITEM_FORM);
      await queryClient.invalidateQueries({ queryKey: ['catalog-menu-items', accessToken] });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: ({
      menuItemId,
      payload,
    }: {
      menuItemId: string;
      payload: Partial<CreateMenuItem>;
    }) => updateMenuItem(accessToken, menuItemId, payload),
    onSuccess: async () => {
      setEditingMenuItem(null);
      await queryClient.invalidateQueries({
        queryKey: ['catalog-menu-items', accessToken],
      });
    },
  });

  const headerStatus = useMemo(() => {
    if (!tokenReady) {
      return 'Provide a Supabase access token to use protected catalog endpoints.';
    }
    return 'Connected. Catalog endpoints are ready for item and menu-item management.';
  }, [tokenReady]);

  const onCreateItem = async () => {
    setItemFormError(null);
    const purchaseFactor = Number(itemForm.purchase_to_stock_factor);
    if (Number.isNaN(purchaseFactor) || purchaseFactor <= 0) {
      setItemFormError('Purchase-to-stock factor must be a positive number.');
      return;
    }

    const payload: CreateItem = {
      name: itemForm.name.trim(),
      type: itemForm.type,
      category: itemForm.category.trim(),
      stock_uom: itemForm.stock_uom.trim(),
      purchase_uom: itemForm.purchase_uom.trim(),
      purchase_to_stock_factor: purchaseFactor,
      storage_zone: itemForm.storage_zone,
      allergens: itemForm.allergensCsv
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
      image_url: itemForm.image_url.trim().length > 0 ? itemForm.image_url.trim() : null,
      is_active: itemForm.is_active,
    };

    if (!payload.name || !payload.category || !payload.stock_uom || !payload.purchase_uom) {
      setItemFormError('Name, category, stock UOM, and purchase UOM are required.');
      return;
    }

    await createItemMutation.mutateAsync(payload);
  };

  const onUpdateItem = async () => {
    if (!editingItem) {
      return;
    }

    const payload: UpdateItem = {
      name: editingItem.name.trim(),
      category: editingItem.category.trim(),
      is_active: editingItem.is_active,
    };
    await updateItemMutation.mutateAsync({ itemId: editingItem.id, payload });
  };

  const onCreateMenuItem = async () => {
    setMenuItemFormError(null);
    const menuPrice = Number(menuItemForm.menu_price);
    const targetFoodCostPct = Number(menuItemForm.target_food_cost_pct);

    if (Number.isNaN(menuPrice) || menuPrice < 0) {
      setMenuItemFormError('Menu price must be a non-negative number.');
      return;
    }
    if (Number.isNaN(targetFoodCostPct) || targetFoodCostPct < 0 || targetFoodCostPct > 1) {
      setMenuItemFormError('Target food cost % must be between 0 and 1.');
      return;
    }

    const payload: CreateMenuItem = {
      name: menuItemForm.name.trim(),
      menu_price: menuPrice,
      target_food_cost_pct: targetFoodCostPct,
      is_active: menuItemForm.is_active,
    };

    if (!payload.name) {
      setMenuItemFormError('Menu item name is required.');
      return;
    }

    await createMenuItemMutation.mutateAsync(payload);
  };

  const onUpdateMenuItem = async () => {
    if (!editingMenuItem) {
      return;
    }

    await updateMenuItemMutation.mutateAsync({
      menuItemId: editingMenuItem.id,
      payload: {
        name: editingMenuItem.name.trim(),
        menu_price: editingMenuItem.menu_price,
        target_food_cost_pct: editingMenuItem.target_food_cost_pct,
        is_active: editingMenuItem.is_active,
      },
    });
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">SupplyFlow Catalog Console</h1>
        <p className="text-sm text-muted-foreground">{headerStatus}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>API Access Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="access-token">Bearer token</Label>
          <Input
            id="access-token"
            type="password"
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            placeholder="Paste Supabase JWT access token"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant={activeView === 'items' ? 'default' : 'outline'}
          onClick={() => setActiveView('items')}
        >
          Items
        </Button>
        <Button
          variant={activeView === 'menu-items' ? 'default' : 'outline'}
          onClick={() => setActiveView('menu-items')}
        >
          Menu Items
        </Button>
      </div>

      {!tokenReady ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Enter a token to load catalog data.
          </CardContent>
        </Card>
      ) : null}

      {activeView === 'items' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={itemForm.name}
                onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })}
              />

              <Label htmlFor="item-type">Type</Label>
              <select
                id="item-type"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={itemForm.type}
                onChange={(event) =>
                  setItemForm({
                    ...itemForm,
                    type: event.target.value as CreateItem['type'],
                  })
                }
              >
                <option value="raw">raw</option>
                <option value="sub_recipe">sub_recipe</option>
                <option value="packaging">packaging</option>
                <option value="finished_good">finished_good</option>
              </select>

              <Label htmlFor="item-category">Category</Label>
              <Input
                id="item-category"
                value={itemForm.category}
                onChange={(event) =>
                  setItemForm({ ...itemForm, category: event.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="item-stock-uom">Stock UOM</Label>
                  <Input
                    id="item-stock-uom"
                    value={itemForm.stock_uom}
                    onChange={(event) =>
                      setItemForm({ ...itemForm, stock_uom: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="item-purchase-uom">Purchase UOM</Label>
                  <Input
                    id="item-purchase-uom"
                    value={itemForm.purchase_uom}
                    onChange={(event) =>
                      setItemForm({ ...itemForm, purchase_uom: event.target.value })
                    }
                  />
                </div>
              </div>

              <Label htmlFor="item-purchase-factor">Purchase-to-stock factor</Label>
              <Input
                id="item-purchase-factor"
                type="number"
                min="0"
                step="0.001"
                value={itemForm.purchase_to_stock_factor}
                onChange={(event) =>
                  setItemForm({
                    ...itemForm,
                    purchase_to_stock_factor: event.target.value,
                  })
                }
              />

              <Label htmlFor="item-storage-zone">Storage zone</Label>
              <select
                id="item-storage-zone"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={itemForm.storage_zone}
                onChange={(event) =>
                  setItemForm({
                    ...itemForm,
                    storage_zone: event.target.value as CreateItem['storage_zone'],
                  })
                }
              >
                <option value="dry">dry</option>
                <option value="refrigerated">refrigerated</option>
                <option value="frozen">frozen</option>
              </select>

              <Label htmlFor="item-allergens">Allergens (comma separated)</Label>
              <Input
                id="item-allergens"
                value={itemForm.allergensCsv}
                onChange={(event) =>
                  setItemForm({ ...itemForm, allergensCsv: event.target.value })
                }
              />

              <Label htmlFor="item-image-url">Image URL (optional)</Label>
              <Input
                id="item-image-url"
                value={itemForm.image_url}
                onChange={(event) =>
                  setItemForm({ ...itemForm, image_url: event.target.value })
                }
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={itemForm.is_active}
                  onChange={(event) =>
                    setItemForm({ ...itemForm, is_active: event.target.checked })
                  }
                />
                Active
              </label>

              {itemFormError ? (
                <p className="text-sm text-red-600">{itemFormError}</p>
              ) : null}
              {createItemMutation.error ? (
                <p className="text-sm text-red-600">{createItemMutation.error.message}</p>
              ) : null}

              <Button onClick={onCreateItem} disabled={createItemMutation.isPending || !tokenReady}>
                {createItemMutation.isPending ? 'Creating...' : 'Create Item'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {itemsQuery.isLoading ? <p>Loading items...</p> : null}
              {itemsQuery.error ? (
                <p className="text-sm text-red-600">{itemsQuery.error.message}</p>
              ) : null}
              {itemsQuery.data?.length ? (
                <ul className="space-y-2">
                  {itemsQuery.data.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground">
                            {item.type} • {item.category}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                          Edit
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {itemsQuery.data && itemsQuery.data.length === 0 && !itemsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">No items yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Menu Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="menu-item-name">Name</Label>
              <Input
                id="menu-item-name"
                value={menuItemForm.name}
                onChange={(event) =>
                  setMenuItemForm({ ...menuItemForm, name: event.target.value })
                }
              />

              <Label htmlFor="menu-item-price">Menu Price</Label>
              <Input
                id="menu-item-price"
                type="number"
                min="0"
                step="0.01"
                value={menuItemForm.menu_price}
                onChange={(event) =>
                  setMenuItemForm({ ...menuItemForm, menu_price: event.target.value })
                }
              />

              <Label htmlFor="menu-item-target">Target Food Cost % (0-1)</Label>
              <Input
                id="menu-item-target"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={menuItemForm.target_food_cost_pct}
                onChange={(event) =>
                  setMenuItemForm({
                    ...menuItemForm,
                    target_food_cost_pct: event.target.value,
                  })
                }
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={menuItemForm.is_active}
                  onChange={(event) =>
                    setMenuItemForm({
                      ...menuItemForm,
                      is_active: event.target.checked,
                    })
                  }
                />
                Active
              </label>

              {menuItemFormError ? (
                <p className="text-sm text-red-600">{menuItemFormError}</p>
              ) : null}
              {createMenuItemMutation.error ? (
                <p className="text-sm text-red-600">{createMenuItemMutation.error.message}</p>
              ) : null}

              <Button
                onClick={onCreateMenuItem}
                disabled={createMenuItemMutation.isPending || !tokenReady}
              >
                {createMenuItemMutation.isPending ? 'Creating...' : 'Create Menu Item'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {menuItemsQuery.isLoading ? <p>Loading menu items...</p> : null}
              {menuItemsQuery.error ? (
                <p className="text-sm text-red-600">{menuItemsQuery.error.message}</p>
              ) : null}
              {menuItemsQuery.data?.length ? (
                <ul className="space-y-2">
                  {menuItemsQuery.data.map((menuItem) => (
                    <li
                      key={menuItem.id}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{menuItem.name}</p>
                          <p className="text-muted-foreground">
                            ${menuItem.menu_price.toFixed(2)} • target{' '}
                            {(menuItem.target_food_cost_pct * 100).toFixed(1)}%
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMenuItem(menuItem)}
                        >
                          Edit
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {menuItemsQuery.data && menuItemsQuery.data.length === 0 && !menuItemsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">No menu items yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {editingItem ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Item</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="edit-item-name">Name</Label>
              <Input
                id="edit-item-name"
                value={editingItem.name}
                onChange={(event) =>
                  setEditingItem({ ...editingItem, name: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-item-category">Category</Label>
              <Input
                id="edit-item-category"
                value={editingItem.category}
                onChange={(event) =>
                  setEditingItem({ ...editingItem, category: event.target.value })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm lg:mt-7">
              <input
                type="checkbox"
                checked={editingItem.is_active}
                onChange={(event) =>
                  setEditingItem({ ...editingItem, is_active: event.target.checked })
                }
              />
              Active
            </label>
            {updateItemMutation.error ? (
              <p className="text-sm text-red-600 lg:col-span-3">
                {updateItemMutation.error.message}
              </p>
            ) : null}
            <div className="flex gap-2 lg:col-span-3">
              <Button onClick={onUpdateItem} disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? 'Saving...' : 'Save Item'}
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {editingMenuItem ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Menu Item</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="edit-menu-item-name">Name</Label>
              <Input
                id="edit-menu-item-name"
                value={editingMenuItem.name}
                onChange={(event) =>
                  setEditingMenuItem({ ...editingMenuItem, name: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-menu-item-price">Menu Price</Label>
              <Input
                id="edit-menu-item-price"
                type="number"
                min="0"
                step="0.01"
                value={editingMenuItem.menu_price}
                onChange={(event) =>
                  setEditingMenuItem({
                    ...editingMenuItem,
                    menu_price: Number(event.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-menu-item-target">Target Food Cost %</Label>
              <Input
                id="edit-menu-item-target"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={editingMenuItem.target_food_cost_pct}
                onChange={(event) =>
                  setEditingMenuItem({
                    ...editingMenuItem,
                    target_food_cost_pct: Number(event.target.value),
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm lg:col-span-3">
              <input
                type="checkbox"
                checked={editingMenuItem.is_active}
                onChange={(event) =>
                  setEditingMenuItem({
                    ...editingMenuItem,
                    is_active: event.target.checked,
                  })
                }
              />
              Active
            </label>
            {updateMenuItemMutation.error ? (
              <p className="text-sm text-red-600 lg:col-span-3">
                {updateMenuItemMutation.error.message}
              </p>
            ) : null}
            <div className="flex gap-2 lg:col-span-3">
              <Button onClick={onUpdateMenuItem} disabled={updateMenuItemMutation.isPending}>
                {updateMenuItemMutation.isPending ? 'Saving...' : 'Save Menu Item'}
              </Button>
              <Button variant="outline" onClick={() => setEditingMenuItem(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
