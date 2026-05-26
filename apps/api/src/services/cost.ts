/**
 * Recalculates plate cost for a menu item based on current stock_level avg_cost values.
 * Called after: BOM version change, vendor price update, cost snapshot job.
 */
export async function recalculatePlateCost(
  _db: unknown,
  _menuItemId: string,
  _tenantId: string,
): Promise<number> {
  // TODO: load exploded BOM, join avg_cost from stock_level, sum
  return 0;
}
