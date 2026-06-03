import type { ComponentEdge } from './explode.js';

/**
 * Check whether the BOM DAG starting at `rootEdges` contains any cycle.
 *
 * A cycle means a sub-recipe directly or transitively references itself,
 * which would cause the BOM explosion to loop forever.
 *
 * Uses iterative depth-first search with a "grey set" (in-progress ancestors)
 * to detect back-edges without a call-stack limit.
 *
 * @returns `null` if the DAG is acyclic, or the itemId that forms the cycle.
 */
export function findCycle(rootEdges: ComponentEdge[]): string | null {
  // Stack entries: [edge, ancestors set]
  // We track the full ancestor path so we can detect when a sub-recipe
  // references one of its own ancestors.
  const stack: Array<[ComponentEdge, Set<string>]> = rootEdges.map((e) => [
    e,
    new Set<string>(),
  ]);

  while (stack.length > 0) {
    const entry = stack.pop();
    if (entry === undefined) break;
    const [edge, ancestors] = entry;

    if (edge.isSubRecipe) {
      if (ancestors.has(edge.itemId)) {
        return edge.itemId;
      }

      if (edge.bom) {
        const nextAncestors = new Set(ancestors);
        nextAncestors.add(edge.itemId);
        for (const child of edge.bom) {
          stack.push([child, nextAncestors]);
        }
      }
    }
  }

  return null;
}

/**
 * Throws if the BOM contains a cycle.
 * Call this before persisting a new recipe version.
 */
export function assertAcyclic(rootEdges: ComponentEdge[], recipeName: string): void {
  const cycle = findCycle(rootEdges);
  if (cycle !== null) {
    throw new Error(
      `Circular BOM reference detected in "${recipeName}": item "${cycle}" is its own ancestor.`,
    );
  }
}
