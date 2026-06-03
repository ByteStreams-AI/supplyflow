import { z } from 'zod';
import { UuidSchema, DatetimeSchema } from './tenancy.js';

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export const ItemTypeSchema = z.enum(['raw', 'sub_recipe', 'packaging', 'finished_good']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const StorageZoneSchema = z.enum(['dry', 'refrigerated', 'frozen']);
export type StorageZone = z.infer<typeof StorageZoneSchema>;

export const ItemSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  name: z.string().min(1).max(300),
  type: ItemTypeSchema,
  category: z.string(),
  /** The unit used for stock and depletion (e.g. "kg", "each"). */
  stock_uom: z.string(),
  /** The unit used on purchase orders (e.g. "case", "lb"). */
  purchase_uom: z.string(),
  /** How many stock_uom units are in one purchase_uom unit. */
  purchase_to_stock_factor: z.number().positive(),
  storage_zone: StorageZoneSchema,
  allergens: z.array(z.string()),
  image_url: z.string().url().nullable(),
  is_active: z.boolean(),
  created_at: DatetimeSchema,
  updated_at: DatetimeSchema,
});
export type Item = z.infer<typeof ItemSchema>;

// ---------------------------------------------------------------------------
// Menu Item
// ---------------------------------------------------------------------------

export const MenuItemSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  name: z.string().min(1).max(300),
  menu_price: z.number().nonnegative(),
  target_food_cost_pct: z.number().min(0).max(1),
  is_active: z.boolean(),
  created_at: DatetimeSchema,
  updated_at: DatetimeSchema,
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

// ---------------------------------------------------------------------------
// Recipe Version & Components (the BOM DAG)
// ---------------------------------------------------------------------------

export const RecipeOwnerTypeSchema = z.enum(['menu_item', 'sub_recipe']);
export type RecipeOwnerType = z.infer<typeof RecipeOwnerTypeSchema>;

export const RecipeVersionSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  owner_type: RecipeOwnerTypeSchema,
  owner_id: UuidSchema,
  version_no: z.number().int().positive(),
  /** Qty produced per one production run of this recipe (in yield_uom). */
  yield_qty: z.number().positive(),
  yield_uom: z.string(),
  is_current: z.boolean(),
  created_at: DatetimeSchema,
});
export type RecipeVersion = z.infer<typeof RecipeVersionSchema>;

export const RecipeComponentSchema = z.object({
  id: UuidSchema,
  recipe_version_id: UuidSchema,
  /** Must be an item whose type is 'raw', 'packaging', or 'sub_recipe'. */
  component_item_id: UuidSchema,
  qty: z.number().positive(),
  uom: z.string(),
  /** Fractional waste/shrinkage, e.g. 0.05 for 5 %. */
  waste_pct: z.number().min(0).max(1),
});
export type RecipeComponent = z.infer<typeof RecipeComponentSchema>;

export const SubstitutionSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  primary_item_id: UuidSchema,
  substitute_item_id: UuidSchema,
  /** Conversion ratio: 1 unit of primary = ratio units of substitute. */
  ratio: z.number().positive(),
  notes: z.string().nullable(),
});
export type Substitution = z.infer<typeof SubstitutionSchema>;

// ---------------------------------------------------------------------------
// Request / Response shapes used by the API
// ---------------------------------------------------------------------------

export const CreateItemSchema = ItemSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
});
export type CreateItem = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItem = z.infer<typeof UpdateItemSchema>;

export const CreateMenuItemSchema = MenuItemSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
});
export type CreateMenuItem = z.infer<typeof CreateMenuItemSchema>;

export const UpsertRecipeVersionSchema = z.object({
  yield_qty: z.number().positive(),
  yield_uom: z.string(),
  components: z.array(
    z.object({
      component_item_id: UuidSchema,
      qty: z.number().positive(),
      uom: z.string(),
      waste_pct: z.number().min(0).max(1),
    }),
  ),
});
export type UpsertRecipeVersion = z.infer<typeof UpsertRecipeVersionSchema>;
