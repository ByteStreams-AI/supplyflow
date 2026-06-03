/**
 * A single edge in the BOM DAG — one component of a recipe.
 *
 * For a raw item:  isSubRecipe=false, bom is undefined.
 * For a sub-recipe: isSubRecipe=true, bom contains the sub-recipe's own components,
 *                   and yieldQty is how many stock-UOM units one production run yields.
 */
export type ComponentEdge = {
  itemId: string;
  isSubRecipe: boolean;
  /** Qty of this component required per 1 unit of the parent recipe output. */
  qty: number;
  /** Fractional waste/shrinkage, e.g. 0.05 for 5%. Applied on top of qty. */
  wastePct: number;
  /**
   * Production yield of this sub-recipe per one "run".
   * Only relevant when isSubRecipe=true.  Defaults to 1 for raw items.
   */
  yieldQty: number;
  /** Child components if this edge is a sub-recipe. */
  bom?: ComponentEdge[];
};

/**
 * Explode a BOM for `qtySold` units of the parent recipe.
 *
 * Returns a map of raw itemId → total quantity needed (in stock UOM),
 * accounting for all nested sub-recipes, yield, and waste percentages.
 *
 * Iterative (stack-based) to avoid call-stack overflow on deeply nested BOMs.
 * Time: O(n) where n = total number of edges in the fully-expanded BOM.
 */
export function explode(
  bom: ComponentEdge[],
  qtySold: number,
): Map<string, number> {
  const result = new Map<string, number>();
  const stack: Array<[ComponentEdge, number]> = bom.map((c) => [c, qtySold]);

  while (stack.length > 0) {
    const item = stack.pop();
    if (item === undefined) break;
    const [edge, multiplier] = item;

    const effectiveQty = edge.qty * multiplier * (1 + edge.wastePct);

    if (edge.isSubRecipe && edge.bom !== undefined && edge.bom.length > 0) {
      const perUnitMultiplier = effectiveQty / edge.yieldQty;
      for (const child of edge.bom) {
        stack.push([child, perUnitMultiplier]);
      }
    } else {
      result.set(edge.itemId, (result.get(edge.itemId) ?? 0) + effectiveQty);
    }
  }

  return result;
}
