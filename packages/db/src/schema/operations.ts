import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { tenant, location } from './tenancy.js';
import { item } from './catalog.js';
import { purchaseOrder } from './procurement.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const storageAreaZoneEnum = pgEnum('storage_area_zone', [
  'dry',
  'refrigerated',
  'frozen',
  'bar',
]);

export const txnTypeEnum = pgEnum('txn_type', [
  'receipt',
  'sale_depletion',
  'waste',
  'transfer_out',
  'transfer_in',
  'adjustment',
  'count_correction',
  'production',
]);

export const stockCountTypeEnum = pgEnum('stock_count_type', ['full', 'cycle']);

export const stockCountStatusEnum = pgEnum('stock_count_status', [
  'open',
  'submitted',
  'reconciled',
]);

export const transferStatusEnum = pgEnum('transfer_status', [
  'requested',
  'approved',
  'picked',
  'in_transit',
  'received',
  'cancelled',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const storageArea = pgTable('storage_area', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  location_id: uuid('location_id')
    .notNull()
    .references(() => location.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  zone: storageAreaZoneEnum('zone').notNull(),
  parent_area_id: uuid('parent_area_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Projection of the append-only ledger for fast reads. */
export const stockLevel = pgTable('stock_level', {
  tenant_id: uuid('tenant_id').notNull(),
  location_id: uuid('location_id').notNull(),
  item_id: uuid('item_id')
    .notNull()
    .references(() => item.id),
  on_hand_qty: numeric('on_hand_qty', { precision: 14, scale: 6 }).notNull().default('0'),
  avg_cost: numeric('avg_cost', { precision: 10, scale: 4 }).notNull().default('0'),
  reorder_point: numeric('reorder_point', { precision: 12, scale: 6 }).notNull().default('0'),
  par_level: numeric('par_level', { precision: 12, scale: 6 }).notNull().default('0'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Append-only inventory event ledger — no UPDATE/DELETE. */
export const inventoryTransaction = pgTable('inventory_transaction', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  location_id: uuid('location_id').notNull(),
  item_id: uuid('item_id')
    .notNull()
    .references(() => item.id),
  txn_type: txnTypeEnum('txn_type').notNull(),
  qty_delta: numeric('qty_delta', { precision: 14, scale: 6 }).notNull(),
  unit_cost: numeric('unit_cost', { precision: 10, scale: 4 }).notNull().default('0'),
  reason_code: text('reason_code'),
  ref_type: text('ref_type').notNull(),
  ref_id: uuid('ref_id').notNull(),
  created_by: uuid('created_by').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const goodsReceipt = pgTable('goods_receipt', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  purchase_order_id: uuid('purchase_order_id')
    .notNull()
    .references(() => purchaseOrder.id),
  received_by: uuid('received_by').notNull(),
  received_at: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  discrepancies: jsonb('discrepancies'),
  photo_urls: text('photo_urls').array().notNull().default([]),
});

export const stockCount = pgTable('stock_count', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  location_id: uuid('location_id').notNull(),
  type: stockCountTypeEnum('type').notNull(),
  status: stockCountStatusEnum('status').notNull().default('open'),
  created_by: uuid('created_by').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  submitted_at: timestamp('submitted_at', { withTimezone: true }),
  reconciled_at: timestamp('reconciled_at', { withTimezone: true }),
});

export const stockCountLine = pgTable('stock_count_line', {
  id: uuid('id').defaultRandom().primaryKey(),
  stock_count_id: uuid('stock_count_id')
    .notNull()
    .references(() => stockCount.id, { onDelete: 'cascade' }),
  item_id: uuid('item_id')
    .notNull()
    .references(() => item.id),
  counted_qty: numeric('counted_qty', { precision: 12, scale: 6 }).notNull(),
  theoretical_qty: numeric('theoretical_qty', { precision: 12, scale: 6 }).notNull(),
  variance_qty: numeric('variance_qty', { precision: 12, scale: 6 }).notNull(),
});

export const transfer = pgTable('transfer', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  from_location_id: uuid('from_location_id').notNull(),
  to_location_id: uuid('to_location_id').notNull(),
  status: transferStatusEnum('status').notNull().default('requested'),
  lines: jsonb('lines').notNull().default([]),
  requested_by: uuid('requested_by').notNull(),
  approved_by: uuid('approved_by'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  dispatched_at: timestamp('dispatched_at', { withTimezone: true }),
  received_at: timestamp('received_at', { withTimezone: true }),
});

export const salesOrder = pgTable('sales_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  location_id: uuid('location_id').notNull(),
  source_system: text('source_system').notNull(),
  source_order_id: text('source_order_id').notNull(),
  ordered_at: timestamp('ordered_at', { withTimezone: true }).notNull(),
  gross_revenue: numeric('gross_revenue', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('ingested'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const salesOrderLine = pgTable('sales_order_line', {
  id: uuid('id').defaultRandom().primaryKey(),
  sales_order_id: uuid('sales_order_id')
    .notNull()
    .references(() => salesOrder.id, { onDelete: 'cascade' }),
  menu_item_id: uuid('menu_item_id').notNull(),
  qty: numeric('qty', { precision: 10, scale: 4 }).notNull(),
  line_revenue: numeric('line_revenue', { precision: 10, scale: 2 }).notNull(),
});

export const channelItemMap = pgTable('channel_item_map', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  channel: text('channel').notNull(),
  external_item_id: text('external_item_id').notNull(),
  menu_item_id: uuid('menu_item_id').notNull(),
});

export const costSnapshot = pgTable('cost_snapshot', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  menu_item_id: uuid('menu_item_id').notNull(),
  recipe_version_id: uuid('recipe_version_id').notNull(),
  plate_cost: numeric('plate_cost', { precision: 10, scale: 4 }).notNull(),
  food_cost_pct: numeric('food_cost_pct', { precision: 5, scale: 4 }).notNull(),
  snapshot_date: text('snapshot_date').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const abcClassification = pgTable('abc_classification', {
  tenant_id: uuid('tenant_id').notNull(),
  location_id: uuid('location_id').notNull(),
  target_type: text('target_type').notNull(),
  target_id: uuid('target_id').notNull(),
  class: text('class').notNull(),
  value_contribution: numeric('value_contribution', { precision: 5, scale: 4 }).notNull(),
  computed_at: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const forecast = pgTable('forecast', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  location_id: uuid('location_id').notNull(),
  target_type: text('target_type').notNull(),
  target_id: uuid('target_id').notNull(),
  period_start: text('period_start').notNull(),
  period_end: text('period_end').notNull(),
  predicted_qty: numeric('predicted_qty', { precision: 14, scale: 6 }).notNull(),
  confidence: numeric('confidence', { precision: 4, scale: 3 }).notNull(),
  model_version: text('model_version').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const insightAlert = pgTable('insight_alert', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  location_id: uuid('location_id'),
  type: text('type').notNull(),
  severity: text('severity').notNull(),
  payload: jsonb('payload').notNull().default({}),
  status: text('status').notNull().default('open'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  acked_at: timestamp('acked_at', { withTimezone: true }),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
});
