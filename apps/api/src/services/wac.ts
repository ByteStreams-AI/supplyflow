/**
 * Weighted-average cost update on goods receipt.
 *
 * new_avg_cost = (current_on_hand * current_avg_cost + received_qty * receipt_unit_cost)
 *               / (current_on_hand + received_qty)
 */
export function calculateWac(
  currentOnHand: number,
  currentAvgCost: number,
  receivedQty: number,
  receiptUnitCost: number,
): number {
  const totalQty = currentOnHand + receivedQty;
  if (totalQty === 0) return receiptUnitCost;
  return (currentOnHand * currentAvgCost + receivedQty * receiptUnitCost) / totalQty;
}
