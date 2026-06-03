import { z } from 'zod';
import { UuidSchema, DatetimeSchema, DateSchema } from './tenancy.js';

// ---------------------------------------------------------------------------
// Sales Order (DialTone → SupplyFlow ingestion)
// ---------------------------------------------------------------------------

export const SalesSourceSchema = z.enum(['dialtone', 'toast', 'square', 'clover', 'manual']);
export type SalesSource = z.infer<typeof SalesSourceSchema>;

export const SalesOrderStatusSchema = z.enum(['ingested', 'depleted', 'exception']);
export type SalesOrderStatus = z.infer<typeof SalesOrderStatusSchema>;

export const SalesOrderSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  location_id: UuidSchema,
  source_system: SalesSourceSchema,
  /** Original order ID from the source system. */
  source_order_id: z.string(),
  ordered_at: DatetimeSchema,
  gross_revenue: z.number().nonnegative(),
  status: SalesOrderStatusSchema,
  created_at: DatetimeSchema,
});
export type SalesOrder = z.infer<typeof SalesOrderSchema>;

export const SalesOrderLineSchema = z.object({
  id: UuidSchema,
  sales_order_id: UuidSchema,
  menu_item_id: UuidSchema,
  qty: z.number().positive(),
  line_revenue: z.number().nonnegative(),
});
export type SalesOrderLine = z.infer<typeof SalesOrderLineSchema>;

// ---------------------------------------------------------------------------
// Channel Item Map (external POS SKU → SupplyFlow menu item)
// ---------------------------------------------------------------------------

export const ChannelItemMapSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  channel: SalesSourceSchema,
  external_item_id: z.string(),
  menu_item_id: UuidSchema,
});
export type ChannelItemMap = z.infer<typeof ChannelItemMapSchema>;

// ---------------------------------------------------------------------------
// Cost Snapshot
// ---------------------------------------------------------------------------

export const CostSnapshotSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  menu_item_id: UuidSchema,
  recipe_version_id: UuidSchema,
  plate_cost: z.number().nonnegative(),
  /** food_cost / menu_price (0–1). */
  food_cost_pct: z.number().min(0).max(1),
  snapshot_date: DateSchema,
  created_at: DatetimeSchema,
});
export type CostSnapshot = z.infer<typeof CostSnapshotSchema>;

// ---------------------------------------------------------------------------
// ABC Classification
// ---------------------------------------------------------------------------

export const AbcClassSchema = z.enum(['A', 'B', 'C']);
export type AbcClass = z.infer<typeof AbcClassSchema>;

export const AbcTargetTypeSchema = z.enum(['item', 'menu_item']);
export type AbcTargetType = z.infer<typeof AbcTargetTypeSchema>;

export const AbcClassificationSchema = z.object({
  tenant_id: UuidSchema,
  location_id: UuidSchema,
  target_type: AbcTargetTypeSchema,
  target_id: UuidSchema,
  class: AbcClassSchema,
  /** Fractional contribution to total value (0–1). */
  value_contribution: z.number().min(0).max(1),
  computed_at: DatetimeSchema,
});
export type AbcClassification = z.infer<typeof AbcClassificationSchema>;

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

export const ForecastTargetTypeSchema = z.enum(['item', 'menu_item']);
export type ForecastTargetType = z.infer<typeof ForecastTargetTypeSchema>;

export const ForecastSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  location_id: UuidSchema,
  target_type: ForecastTargetTypeSchema,
  target_id: UuidSchema,
  period_start: DateSchema,
  period_end: DateSchema,
  predicted_qty: z.number().nonnegative(),
  /** 0–1 confidence score from the ML model. */
  confidence: z.number().min(0).max(1),
  model_version: z.string(),
  created_at: DatetimeSchema,
});
export type Forecast = z.infer<typeof ForecastSchema>;

// ---------------------------------------------------------------------------
// Insight Alert
// ---------------------------------------------------------------------------

export const InsightAlertTypeSchema = z.enum([
  'low_stock',
  'price_spike',
  'shortage',
  'food_cost',
  'expiry',
  'unmapped_item',
]);
export type InsightAlertType = z.infer<typeof InsightAlertTypeSchema>;

export const InsightAlertSeveritySchema = z.enum(['info', 'warning', 'critical']);
export type InsightAlertSeverity = z.infer<typeof InsightAlertSeveritySchema>;

export const InsightAlertStatusSchema = z.enum(['open', 'ack', 'resolved']);
export type InsightAlertStatus = z.infer<typeof InsightAlertStatusSchema>;

export const InsightAlertSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  location_id: UuidSchema.nullable(),
  type: InsightAlertTypeSchema,
  severity: InsightAlertSeveritySchema,
  payload: z.record(z.string(), z.unknown()),
  status: InsightAlertStatusSchema,
  created_at: DatetimeSchema,
  acked_at: DatetimeSchema.nullable(),
  resolved_at: DatetimeSchema.nullable(),
});
export type InsightAlert = z.infer<typeof InsightAlertSchema>;

// ---------------------------------------------------------------------------
// DialTone webhook payload
// ---------------------------------------------------------------------------

export const DialToneWebhookLineSchema = z.object({
  external_item_id: z.string(),
  item_name: z.string(),
  qty: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

export const DialToneWebhookSchema = z.object({
  order_id: z.string(),
  ordered_at: DatetimeSchema,
  location_ref: z.string(),
  lines: z.array(DialToneWebhookLineSchema),
  gross_revenue: z.number().nonnegative(),
  /** HMAC-SHA256 signature over the serialized body. */
  signature: z.string(),
});
export type DialToneWebhook = z.infer<typeof DialToneWebhookSchema>;
