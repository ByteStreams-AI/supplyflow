import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  timestamp,
  integer,
  date,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { tenant } from './tenancy.js';
import { item } from './catalog.js';
import { location } from './tenancy.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'draft',
  'pending_approval',
  'sent',
  'partially_received',
  'received',
  'closed',
  'cancelled',
]);

export const priceHistorySourceEnum = pgEnum('price_history_source', [
  'po',
  'invoice',
  'manual',
  'feed',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const vendor = pgTable('vendor', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contacts: jsonb('contacts').notNull().default({}),
  payment_terms: text('payment_terms'),
  min_order_value: numeric('min_order_value', { precision: 10, scale: 2 }),
  delivery_windows: jsonb('delivery_windows'),
  lead_time_days: integer('lead_time_days'),
  reliability_score: numeric('reliability_score', { precision: 4, scale: 3 }),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vendorProduct = pgTable('vendor_product', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  vendor_id: uuid('vendor_id')
    .notNull()
    .references(() => vendor.id, { onDelete: 'cascade' }),
  item_id: uuid('item_id')
    .notNull()
    .references(() => item.id),
  vendor_sku: text('vendor_sku').notNull(),
  pack_description: text('pack_description').notNull().default(''),
  pack_qty_in_purchase_uom: numeric('pack_qty_in_purchase_uom', {
    precision: 12,
    scale: 6,
  }).notNull(),
  current_price: numeric('current_price', { precision: 10, scale: 4 }).notNull(),
  lead_time_days: integer('lead_time_days').notNull().default(1),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const priceHistory = pgTable('price_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  vendor_product_id: uuid('vendor_product_id')
    .notNull()
    .references(() => vendorProduct.id),
  price: numeric('price', { precision: 10, scale: 4 }).notNull(),
  effective_date: date('effective_date').notNull(),
  source: priceHistorySourceEnum('source').notNull(),
});

export const purchaseOrder = pgTable('purchase_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  location_id: uuid('location_id')
    .notNull()
    .references(() => location.id),
  vendor_id: uuid('vendor_id')
    .notNull()
    .references(() => vendor.id),
  status: purchaseOrderStatusEnum('status').notNull().default('draft'),
  expected_delivery: date('expected_delivery'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  created_by: uuid('created_by').notNull(),
  approved_by: uuid('approved_by'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const purchaseOrderLine = pgTable('purchase_order_line', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchase_order_id: uuid('purchase_order_id')
    .notNull()
    .references(() => purchaseOrder.id, { onDelete: 'cascade' }),
  vendor_product_id: uuid('vendor_product_id')
    .notNull()
    .references(() => vendorProduct.id),
  qty_ordered: numeric('qty_ordered', { precision: 12, scale: 6 }).notNull(),
  qty_received: numeric('qty_received', { precision: 12, scale: 6 }).notNull().default('0'),
  unit_price: numeric('unit_price', { precision: 10, scale: 4 }).notNull(),
});
