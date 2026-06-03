import { z } from 'zod';
import { UuidSchema, DatetimeSchema, DateSchema } from './tenancy.js';

// ---------------------------------------------------------------------------
// Vendor
// ---------------------------------------------------------------------------

export const VendorSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  name: z.string().min(1).max(300),
  contacts: z.record(z.string(), z.unknown()),
  payment_terms: z.string().nullable(),
  min_order_value: z.number().nonnegative().nullable(),
  delivery_windows: z.record(z.string(), z.unknown()).nullable(),
  lead_time_days: z.number().int().nonnegative().nullable(),
  /** 0–1 score derived from on-time delivery history. */
  reliability_score: z.number().min(0).max(1).nullable(),
  is_active: z.boolean(),
  created_at: DatetimeSchema,
  updated_at: DatetimeSchema,
});
export type Vendor = z.infer<typeof VendorSchema>;

// ---------------------------------------------------------------------------
// Vendor Product
// ---------------------------------------------------------------------------

export const VendorProductSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  vendor_id: UuidSchema,
  item_id: UuidSchema,
  vendor_sku: z.string(),
  pack_description: z.string(),
  /** How many item.purchase_uom units are in one pack. */
  pack_qty_in_purchase_uom: z.number().positive(),
  current_price: z.number().nonnegative(),
  lead_time_days: z.number().int().nonnegative(),
  is_active: z.boolean(),
  created_at: DatetimeSchema,
  updated_at: DatetimeSchema,
});
export type VendorProduct = z.infer<typeof VendorProductSchema>;

// ---------------------------------------------------------------------------
// Price History (append-only)
// ---------------------------------------------------------------------------

export const PriceHistorySourceSchema = z.enum(['po', 'invoice', 'manual', 'feed']);
export type PriceHistorySource = z.infer<typeof PriceHistorySourceSchema>;

export const PriceHistorySchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  vendor_product_id: UuidSchema,
  price: z.number().nonnegative(),
  effective_date: DateSchema,
  source: PriceHistorySourceSchema,
});
export type PriceHistory = z.infer<typeof PriceHistorySchema>;

// ---------------------------------------------------------------------------
// Purchase Order
// ---------------------------------------------------------------------------

export const PurchaseOrderStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'sent',
  'partially_received',
  'received',
  'closed',
  'cancelled',
]);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>;

export const PurchaseOrderSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  location_id: UuidSchema,
  vendor_id: UuidSchema,
  status: PurchaseOrderStatusSchema,
  expected_delivery: DateSchema.nullable(),
  subtotal: z.number().nonnegative(),
  created_by: UuidSchema,
  approved_by: UuidSchema.nullable(),
  created_at: DatetimeSchema,
  updated_at: DatetimeSchema,
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const PurchaseOrderLineSchema = z.object({
  id: UuidSchema,
  purchase_order_id: UuidSchema,
  vendor_product_id: UuidSchema,
  qty_ordered: z.number().positive(),
  qty_received: z.number().nonnegative(),
  unit_price: z.number().nonnegative(),
});
export type PurchaseOrderLine = z.infer<typeof PurchaseOrderLineSchema>;

// ---------------------------------------------------------------------------
// API request shapes
// ---------------------------------------------------------------------------

export const CreateVendorSchema = VendorSchema.omit({
  id: true,
  tenant_id: true,
  reliability_score: true,
  created_at: true,
  updated_at: true,
});
export type CreateVendor = z.infer<typeof CreateVendorSchema>;

export const CreateVendorProductSchema = VendorProductSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
});
export type CreateVendorProduct = z.infer<typeof CreateVendorProductSchema>;

export const CreatePurchaseOrderSchema = z.object({
  location_id: UuidSchema,
  vendor_id: UuidSchema,
  expected_delivery: DateSchema.nullable(),
  lines: z.array(
    z.object({
      vendor_product_id: UuidSchema,
      qty_ordered: z.number().positive(),
      unit_price: z.number().nonnegative(),
    }),
  ),
});
export type CreatePurchaseOrder = z.infer<typeof CreatePurchaseOrderSchema>;
