import { describe, it, expect } from 'vitest';
import { explode } from '../explode.js';
import { findCycle } from '../check-circular.js';
import type { ComponentEdge } from '../explode.js';

// ---------------------------------------------------------------------------
// explode()
// ---------------------------------------------------------------------------

describe('explode', () => {
  it('flat bom — single raw item', () => {
    const bom: ComponentEdge[] = [
      { itemId: 'tomato', isSubRecipe: false, qty: 2, wastePct: 0, yieldQty: 1 },
    ];
    expect(explode(bom, 3)).toEqual(new Map([['tomato', 6]]));
  });

  it('applies waste percentage', () => {
    const bom: ComponentEdge[] = [
      { itemId: 'chicken', isSubRecipe: false, qty: 1, wastePct: 0.1, yieldQty: 1 },
    ];
    const result = explode(bom, 1);
    expect(result.get('chicken')).toBeCloseTo(1.1);
  });

  it('nested sub-recipe with yield', () => {
    // sauce sub-recipe: yields 4 portions; each portion costs 200g tomato + 50g onion
    const sauce: ComponentEdge = {
      itemId: 'sauce',
      isSubRecipe: true,
      qty: 1,       // 1 portion of sauce per menu item
      wastePct: 0,
      yieldQty: 4,  // 1 production run yields 4 portions
      bom: [
        { itemId: 'tomato', isSubRecipe: false, qty: 200, wastePct: 0, yieldQty: 1 },
        { itemId: 'onion',  isSubRecipe: false, qty: 50,  wastePct: 0, yieldQty: 1 },
      ],
    };
    const result = explode([sauce], 2); // sell 2 menu items
    // 2 portions needed → 2/4 = 0.5 production run → 0.5 * 200 = 100g tomato, 0.5 * 50 = 25g onion
    expect(result.get('tomato')).toBeCloseTo(100);
    expect(result.get('onion')).toBeCloseTo(25);
  });

  it('accumulates same raw item from multiple components', () => {
    const bom: ComponentEdge[] = [
      { itemId: 'flour', isSubRecipe: false, qty: 3, wastePct: 0, yieldQty: 1 },
      { itemId: 'flour', isSubRecipe: false, qty: 2, wastePct: 0, yieldQty: 1 },
    ];
    expect(explode(bom, 1).get('flour')).toBeCloseTo(5);
  });

  it('returns empty map for empty bom', () => {
    expect(explode([], 10).size).toBe(0);
  });

  it('qtySold=0 returns zeroed map', () => {
    const bom: ComponentEdge[] = [
      { itemId: 'milk', isSubRecipe: false, qty: 1, wastePct: 0, yieldQty: 1 },
    ];
    expect(explode(bom, 0).get('milk')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// findCycle()
// ---------------------------------------------------------------------------

describe('findCycle', () => {
  it('returns null for acyclic bom', () => {
    const bom: ComponentEdge[] = [
      {
        itemId: 'dough',
        isSubRecipe: true,
        qty: 1,
        wastePct: 0,
        yieldQty: 1,
        bom: [
          { itemId: 'flour', isSubRecipe: false, qty: 2, wastePct: 0, yieldQty: 1 },
          { itemId: 'water', isSubRecipe: false, qty: 1, wastePct: 0, yieldQty: 1 },
        ],
      },
    ];
    expect(findCycle(bom)).toBeNull();
  });

  it('detects direct self-reference', () => {
    // dough references itself as a sub-recipe
    const bom: ComponentEdge[] = [
      {
        itemId: 'dough',
        isSubRecipe: true,
        qty: 1,
        wastePct: 0,
        yieldQty: 1,
        bom: [
          {
            itemId: 'dough', // cycle!
            isSubRecipe: true,
            qty: 1,
            wastePct: 0,
            yieldQty: 1,
          },
        ],
      },
    ];
    expect(findCycle(bom)).toBe('dough');
  });

  it('detects indirect cycle (A → B → A)', () => {
    const bom: ComponentEdge[] = [
      {
        itemId: 'A',
        isSubRecipe: true,
        qty: 1,
        wastePct: 0,
        yieldQty: 1,
        bom: [
          {
            itemId: 'B',
            isSubRecipe: true,
            qty: 1,
            wastePct: 0,
            yieldQty: 1,
            bom: [
              { itemId: 'A', isSubRecipe: true, qty: 1, wastePct: 0, yieldQty: 1 },
            ],
          },
        ],
      },
    ];
    expect(findCycle(bom)).toBe('A');
  });
});
