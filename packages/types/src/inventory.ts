import { z } from 'zod';
import { UuidSchema, DatetimeSchema } from './tenancy.js';

// ---------------------------------------------------------------------------
// Storage Area
// ---------------------------------------------------------------------------

export const StorageAreaZoneSchema = z.enum(['dry', 'refrigerated', 'frozen', 'bar']);
export type StorageAreaZone = z.infer<typeof StorageAreaZoneSchema>;

export const StorageAreaSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  location_id: UuidSchema,
  name: z.string().min(1).max(200),
  zone: StorageAreaZoneSchema,
  parent_area_id: UuidSchema.nullable(),
  created_at: DatetimeSchema,
});
export type StorageArea = z.infer<typeof StorageAreaSchema>;

// ---------------------------------------------------------------------------
// Stock Level (projection — fast-read materialized view)
// ---------------------------------------------------------------------------

export const StockLevelSchema = z.object({
  tenant_id: UuidSchema,
  location_id: UuidSchema,
  item_id: UuidSchema,
  on_hand_qty: z.number(),
  avg_cost: z.number().nonnegative(),
  reorder_point: z.number().nonnegative(),
  par_level: z.number().nonnegative(),
  updated_at: DatetimeSchema,
});
export type StockLevel = z.infer<typeof StockLevelSchema>;

// ---------------------------------------------------------------------------
// Inventory Transaction (append-only ledger)
// ---------------------------------------------------------------------------

export const TxnTypeSchema = z.enum([
  'receipt',
  'sale_depletion',
  'waste',
  'transfer_out',
  'transfer_in',
  'adjustment',
  'count_correction',
  'production',
]);
export type TxnType = z.infer<typeof TxnTypeSchema>;

export const InventoryTransactionSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  location_id: UuidSchema,
  item_id: UuidSchema,
  txn_type: TxnTypeSchema,
  /** Positive = increase, negative = decrease. */
  qty_delta: z.number(),
  unit_cost: z.number().nonnegative(),
  reason_code: z.string().nullable(),
  ref_type: z.string(),
  ref_id: UuidSchema,
  created_by: UuidSchema,
  created_at: DatetimeSchema,
});
export type InventoryTransaction = z.infer<typeof InventoryTransactionSchema>;

// ---------------------------------------------------------------------------
// Goods Receipt
// ---------------------------------------------------------------------------

export const GoodsReceiptSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  purchase_order_id: UuidSchema,
  received_by: UuidSchema,
  received_at: DatetimeSchema,
  discrepancies: z.record(z.string(), z.unknown()).nullable(),
  photo_urls: z.array(z.string().url()),
});
export type GoodsReceipt = z.infer<typeof GoodsReceiptSchema>;

// ---------------------------------------------------------------------------
// Stock Count
// ---------------------------------------------------------------------------

export const StockCountTypeSchema = z.enum(['full', 'cycle']);
export type StockCountType = z.infer<typeof StockCountTypeSchema>;

export const StockCountStatusSchema = z.enum(['open', 'submitted', 'reconciled']);
export type StockCountStatus = z.infer<typeof StockCountStatusSchema>;

export const StockCountSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  location_id: UuidSchema,
  type: StockCountTypeSchema,
  status: StockCountStatusSchema,
  created_by: UuidSchema,
  created_at: DatetimeSchema,
  submitted_at: DatetimeSchema.nullable(),
  reconciled_at: DatetimeSchema.nullable(),
});
export type StockCount = z.infer<typeof StockCountSchema>;

export const StockCountLineSchema = z.object({
  id: UuidSchema,
  stock_count_id: UuidSchema,
  item_id: UuidSchema,
  counted_qty: z.number().nonnegative(),
  theoretical_qty: z.number(),
  variance_qty: z.number(),
});
export type StockCountLine = z.infer<typeof StockCountLineSchema>;

// ---------------------------------------------------------------------------
// Transfer
// ---------------------------------------------------------------------------

export const TransferStatusSchema = z.enum([
  'requested',
  'approved',
  'picked',
  'in_transit',
  'received',
  'cancelled',
]);
export type TransferStatus = z.infer<typeof TransferStatusSchema>;

export const TransferLineSchema = z.object({
  item_id: UuidSchema,
  qty: z.number().positive(),
  uom: z.string(),
});
export type TransferLine = z.infer<typeof TransferLineSchema>;

export const TransferSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  from_location_id: UuidSchema,
  to_location_id: UuidSchema,
  status: TransferStatusSchema,
  lines: z.array(TransferLineSchema),
  requested_by: UuidSchema,
  approved_by: UuidSchema.nullable(),
  created_at: DatetimeSchema,
  dispatched_at: DatetimeSchema.nullable(),
  received_at: DatetimeSchema.nullable(),
});
export type Transfer = z.infer<typeof TransferSchema>;

// ---------------------------------------------------------------------------
// API request shapes
// ---------------------------------------------------------------------------

export const CreateStockCountSchema = z.object({
  location_id: UuidSchema,
  type: StockCountTypeSchema,
});
export type CreateStockCount = z.infer<typeof CreateStockCountSchema>;

export const SubmitCountLineSchema = z.object({
  item_id: UuidSchema,
  counted_qty: z.number().nonnegative(),
});
export type SubmitCountLine = z.infer<typeof SubmitCountLineSchema>;

export const CreateTransferSchema = z.object({
  from_location_id: UuidSchema,
  to_location_id: UuidSchema,
  lines: z.array(TransferLineSchema),
});
export type CreateTransfer = z.infer<typeof CreateTransferSchema>;
