import { explode } from '@supplyflow/bom';
import type { ComponentEdge } from '@supplyflow/bom';

/**
 * Wraps the BOM explosion engine for use in the API.
 * Handles depletion posting for a sales order.
 */
export async function postSaleDepletion(
  db: unknown,
  params: {
    tenantId: string;
    locationId: string;
    salesOrderId: string;
    lines: Array<{ menuItemId: string; bom: ComponentEdge[]; qtySold: number }>;
  },
): Promise<void> {
  void db;
  // TODO: for each line, explode BOM and insert inventory_transaction rows
  for (const line of params.lines) {
    const depleted = explode(line.bom, line.qtySold);
    console.log(`Depletion for menu item ${line.menuItemId}:`, depleted);
  }
}
