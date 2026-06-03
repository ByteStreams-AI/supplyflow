# BOM Explosion, Explained

*How SupplyFlow turns a single menu sale into a precise list of raw ingredients to buy.*

**Audience:** product, operations, sales, and engineering stakeholders.
**No code knowledge required** — the worked example uses plain arithmetic; the code blocks are optional.

---

## 1. The one-sentence version

> When a customer buys a "Classic Burger Plate," SupplyFlow automatically figures out
> *exactly* how much beef, oil, mayo, potato, and every other raw ingredient that sale
> consumed — even when recipes are built out of other recipes, several layers deep.

That automatic figuring-out is called **BOM explosion**. "BOM" = **Bill of Materials**, a
term borrowed from manufacturing: the full parts list required to build one finished product.

---

## 2. Why this is harder than it looks

A naïve system stores a flat ingredient list per menu item. That breaks down fast in a real
kitchen, for five reasons:

| # | Complexity | Real-world example |
|---|---|---|
| 1 | **Recipes are made of other recipes** | A burger uses "house sauce," which is itself a recipe made of mayo + ketchup + relish. |
| 2 | **Nesting goes many levels deep** | Sauce → goes into the assembled burger → goes into the plate. Three levels before you reach a purchasable item. |
| 3 | **Things are made in batches** | You don't make 30 g of sauce; you make a 500 g batch and use a little per plate. The math must divide by the **batch yield**. |
| 4 | **Everything has waste** | Peeling potatoes loses ~15%. Cooking shrinks a patty ~5%. You must *buy more* than the recipe nominally calls for. |
| 5 | **Mistakes loop forever** | If someone accidentally makes "sauce" contain itself, a naïve calculator runs until it crashes. |

A correct engine has to handle **all five at once**. That's the "complexity" this document
is about — and it's the part most cheap inventory tools get wrong (they only go one level deep).

---

## 3. The mental model: a tree, not a list

A recipe isn't a flat list — it's a **tree** (technically a DAG, a directed acyclic graph)
that you walk *downward* until every branch ends in a **raw item** (something you actually
buy from a supplier).

```
Classic Burger Plate                          ← the menu item the customer buys (level 0)
├── Assembled Burger        [sub-recipe]      ← level 1
│   ├── Brioche bun         [raw]   ← buy this
│   ├── Beef patty          [raw, 5% cook shrink]   ← buy this
│   └── Burger Sauce        [sub-recipe]      ← level 2 — a recipe INSIDE a recipe
│       ├── Mayonnaise      [raw]   ← buy this
│       ├── Ketchup         [raw]   ← buy this
│       └── Relish          [raw]   ← buy this
└── Fries                   [sub-recipe]      ← level 1
    ├── Potatoes            [raw, 15% peel waste]   ← buy this
    └── Fryer oil           [raw]   ← buy this
```

- **Green leaves** (raw items) are the only things you can put on a purchase order.
- **Branches** (sub-recipes) are intermediate products you make in-house — they never appear
  on a supplier order, so the engine "explodes" through them and discards them.

---

## 4. The two pieces of math that make it correct

Every component carries two numbers beyond its quantity:

### a) Waste % — "buy more than you use"

> **effective quantity = quantity × (1 + waste%)**

If a plate needs 2.0 kg of potatoes but 15% is lost to peeling, you must actually consume
`2.0 × 1.15 = 2.3 kg`. Waste **compounds** at every level it passes through.

### b) Yield divisor — "made in batches, used by the spoonful"

A sub-recipe is produced in a **batch** (the *yield*), but a single plate uses only a fraction
of it.

> **batches needed = total quantity required ÷ yield per batch**

Burger Sauce is made 500 g at a time, but one plate uses 30 g. To serve 10 plates you need
`30 × 10 = 300 g` of sauce, which is `300 ÷ 500 = 0.6` of a batch — so you draw down 60% of
the batch's raw ingredients.

**Combined, for any node the engine computes:**

> effectiveQty = qty × multiplier × (1 + wastePct)
> *(if it's a sub-recipe)* → pass `effectiveQty ÷ yieldQty` down to its children as the new multiplier
> *(if it's a raw item)* → add `effectiveQty` to the shopping list

---

## 5. Fully worked example: sell **10** Classic Burger Plates

Watch the multiplier flow from the top down. We start by selling **10** plates.

| Path | Calculation | Result |
|---|---|---|
| **Assembled Burger** (sub) | needs `1 × 10` = 10, batch yield 1 → pass **×10** down | — |
| → Brioche bun (raw) | `1 × 10 × 1.00` | **10** buns |
| → Beef patty (raw, 5% shrink) | `1 × 10 × 1.05` | **10.5** patties |
| → **Burger Sauce** (sub) | needs `30 × 10` = 300 g, batch yield 500 → pass **×0.6** down | — |
| →→ Mayonnaise (raw) | `300 × 0.6` | **180** g |
| →→ Ketchup (raw) | `150 × 0.6` | **90** g |
| →→ Relish (raw) | `50 × 0.6` | **30** g |
| **Fries** (sub) | needs `1 × 10` = 10 portions, batch yield 10 → pass **×1** down | — |
| → Potatoes (raw, 15% waste) | `2.0 × 1 × 1.15` | **2.3** kg |
| → Fryer oil (raw) | `0.05 × 1` | **0.05** L |

**The exploded result — your actual draw-down / shopping list:**

| Raw item | Quantity consumed by 10 plates |
|---|---|
| Brioche bun | 10 |
| Beef patty | 10.5 |
| Mayonnaise | 180 g |
| Ketchup | 90 g |
| Relish | 30 g |
| Potatoes | 2.3 kg |
| Fryer oil | 0.05 L |

Notice: **the sub-recipes themselves (Assembled Burger, Burger Sauce, Fries) are gone.** Only
purchasable raw items remain — which is exactly what a purchase order needs.

---

## 6. The safety net: cycle detection

The single most dangerous BOM error is a **circular reference** — recipe A contains recipe B,
which contains recipe A again. A naïve calculator would loop forever and crash.

Before SupplyFlow ever saves a new recipe version, it runs a check that walks the tree and
fails loudly if any recipe is found to be its own ancestor:

> `Circular BOM reference detected in "House Sauce": item "house-sauce" is its own ancestor.`

This turns a catastrophic runtime crash into a clear, up-front validation error.

---

## 7. Why it matters for the business

This engine is the hidden machinery behind SupplyFlow's core loop:

> **POS sale → ingredient depletion → reorder against par levels → purchase order to supplier**

Every burger sold silently and correctly draws down beef, oil, and condiments at precise
fractional quantities. Without accurate explosion you get one of two failures operators hate:
running out of stock mid-service, or over-ordering and watching food spoil. Getting the
*nested, batched, waste-adjusted* math right is what separates a real food-cost system from a
glorified spreadsheet — and it's the layer most competitors only implement one level deep.

---

## Appendix A — How a developer expresses this recipe

Each node is a `ComponentEdge`. Sub-recipes carry their own `bom` array of children:

```ts
const classicBurgerPlate: ComponentEdge[] = [
  {
    itemId: "assembled-burger", isSubRecipe: true, qty: 1, wastePct: 0, yieldQty: 1,
    bom: [
      { itemId: "brioche-bun", isSubRecipe: false, qty: 1, wastePct: 0,    yieldQty: 1 },
      { itemId: "beef-patty",  isSubRecipe: false, qty: 1, wastePct: 0.05, yieldQty: 1 },
      {
        itemId: "burger-sauce", isSubRecipe: true, qty: 30, wastePct: 0, yieldQty: 500, // use 30g, batch = 500g
        bom: [
          { itemId: "mayonnaise", isSubRecipe: false, qty: 300, wastePct: 0, yieldQty: 1 }, // per batch
          { itemId: "ketchup",    isSubRecipe: false, qty: 150, wastePct: 0, yieldQty: 1 },
          { itemId: "relish",     isSubRecipe: false, qty: 50,  wastePct: 0, yieldQty: 1 },
        ],
      },
    ],
  },
  {
    itemId: "fries", isSubRecipe: true, qty: 1, wastePct: 0, yieldQty: 10, // 1 portion, batch = 10 portions
    bom: [
      { itemId: "potatoes",  isSubRecipe: false, qty: 2.0,  wastePct: 0.15, yieldQty: 1 }, // 2kg per batch
      { itemId: "fryer-oil", isSubRecipe: false, qty: 0.05, wastePct: 0,    yieldQty: 1 },
    ],
  },
];

// Sell 10 plates:
explode(classicBurgerPlate, 10);
// → Map { "brioche-bun"=>10, "beef-patty"=>10.5, "mayonnaise"=>180,
//         "ketchup"=>90, "relish"=>30, "potatoes"=>2.3, "fryer-oil"=>0.05 }
```

## Appendix B — Engineering notes

- **Iterative, not recursive.** The engine uses a stack-based walk rather than recursion, so
  arbitrarily deep recipe trees can't overflow the call stack. Time complexity is **O(n)** in
  the total number of edges.
- **Cached.** Exploded BOMs are cached in Cloudflare KV keyed by `recipe_version_id`, and
  invalidated whenever a new recipe version is created — so repeated sales don't re-compute.
- **Validated on write.** `assertAcyclic()` runs before persisting any new recipe version
  (see §6).
- **Source:** [`packages/bom/src/explode.ts`](../packages/bom/src/explode.ts) and
  [`packages/bom/src/check-circular.ts`](../packages/bom/src/check-circular.ts).
