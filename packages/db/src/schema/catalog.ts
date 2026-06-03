import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { tenant } from './tenancy.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const itemTypeEnum = pgEnum('item_type', [
  'raw',
  'sub_recipe',
  'packaging',
  'finished_good',
]);

export const storageZoneEnum = pgEnum('storage_zone', ['dry', 'refrigerated', 'frozen']);

export const recipeOwnerTypeEnum = pgEnum('recipe_owner_type', ['menu_item', 'sub_recipe']);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const item = pgTable('item', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: itemTypeEnum('type').notNull(),
  category: text('category').notNull().default(''),
  stock_uom: text('stock_uom').notNull(),
  purchase_uom: text('purchase_uom').notNull(),
  purchase_to_stock_factor: numeric('purchase_to_stock_factor', {
    precision: 12,
    scale: 6,
  }).notNull(),
  storage_zone: storageZoneEnum('storage_zone').notNull().default('dry'),
  allergens: text('allergens').array().notNull().default([]),
  image_url: text('image_url'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const menuItem = pgTable('menu_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  menu_price: numeric('menu_price', { precision: 10, scale: 2 }).notNull(),
  target_food_cost_pct: numeric('target_food_cost_pct', { precision: 5, scale: 4 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recipeVersion = pgTable('recipe_version', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  owner_type: recipeOwnerTypeEnum('owner_type').notNull(),
  owner_id: uuid('owner_id').notNull(),
  version_no: integer('version_no').notNull(),
  yield_qty: numeric('yield_qty', { precision: 12, scale: 6 }).notNull(),
  yield_uom: text('yield_uom').notNull(),
  is_current: boolean('is_current').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recipeComponent = pgTable('recipe_component', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipe_version_id: uuid('recipe_version_id')
    .notNull()
    .references(() => recipeVersion.id, { onDelete: 'cascade' }),
  component_item_id: uuid('component_item_id')
    .notNull()
    .references(() => item.id),
  qty: numeric('qty', { precision: 12, scale: 6 }).notNull(),
  uom: text('uom').notNull(),
  waste_pct: numeric('waste_pct', { precision: 5, scale: 4 }).notNull().default('0'),
});

export const substitution = pgTable('substitution', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  primary_item_id: uuid('primary_item_id')
    .notNull()
    .references(() => item.id),
  substitute_item_id: uuid('substitute_item_id')
    .notNull()
    .references(() => item.id),
  ratio: numeric('ratio', { precision: 10, scale: 6 }).notNull(),
  notes: text('notes'),
});
