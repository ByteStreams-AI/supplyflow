# SupplyFlow — Market Validation: Restaurant/F&B Supply-Chain SaaS

**Date:** 2026-06-02
**Status:** Draft — directional research
**Author:** ByteStreams

> ⚠️ **Confidence caveat:** The figures in this document are directional estimates drawn
> from domain knowledge (AI knowledge cutoff Jan 2026), **not** freshly verified citations.
> Treat all market-size and pricing numbers as approximate and **verify before using in a
> pitch deck, board document, or investor materials.** Confidence levels are flagged inline.

---

## 1. Market Size & Trends

- **Restaurant management software (RMS)** overall is a large, growing category — commonly
  cited at **~$5–6B (2024)** growing to **~$15–20B by the early 2030s**, at a low-double-digit
  CAGR (**~12–17%**). *(Medium confidence — analyst estimates vary widely by how they scope "RMS.")*
- The **back-of-house (BOH) / inventory & procurement** slice is a smaller subset of that, but
  it is the **fastest-growing** because POS (front-of-house) is saturated and commoditized.
  Value is migrating to BOH: food cost, inventory, labor, supplier ordering.

**Key tailwinds (2024–2026):**

- **Persistent food-cost inflation** → operators desperate for COGS control. Food cost is
  28–35% of revenue; a 1–2% improvement is material to the bottom line.
- **Labor shortage** → demand for automation of manual counts, ordering, and invoice entry.
- **AI/forecasting expectations** → buyers now expect demand prediction and automated
  par-level suggestions as standard.
- **POS platform consolidation** (Toast, Square) absorbing BOH via acquisition (Toast bought
  xtraCHEF) — both a competitive threat and validation of the category.

---

## 2. Competitive Landscape

| Player | Segment | Strengths | Pricing (approx.) |
|---|---|---|---|
| **Restaurant365** | Mid-market / multi-unit | All-in-one: accounting + inventory + scheduling. Category leader. | $$$ — per-location, often $400+/loc/mo, accounting-led |
| **MarketMan** | SMB → mid | Inventory, ordering, supplier catalogs, invoice scanning. | ~$150–400/loc/mo |
| **xtraCHEF (Toast)** | Toast users | Invoice automation, recipe costing; bundled into Toast. | Bundled / add-on |
| **Crunchtime** | Enterprise chains | Deep ops, inventory, labor for large brands. | $$$$ enterprise |
| **Apicbase** | EU, multi-unit, ghost kitchens | Strong recipe/BOM costing, menu engineering. | $$ mid |
| **BlueCart / Notch** | Supplier ordering / marketplace | Buyer–supplier ordering networks. | Varies |
| **Galley** | Recipe/production data | Recipe + production scaling, API-first. | $$ |

**Takeaways:**

- The space is **crowded but fragmented** — no single winner across all segments.
- **Incumbents are accounting-led (R365) or POS-bundled (xtraCHEF).** Few are genuinely
  **AI/forecasting-led** or **engineering-grade on BOM explosion**.
- Most SMB tools have **weak offline mobile** and **shallow multi-level recipe (sub-recipe) costing**.

---

## 3. Core Customer Pain Points

1. **Food cost control / COGS visibility** — #1 buying driver. Operators fly blind between
   monthly counts.
2. **Inventory shrinkage & waste** — theft, spoilage, over-portioning; hard to attribute.
3. **Recipe/BOM costing** — especially **nested sub-recipes, yields, and waste %**. Most tools
   handle one level poorly. *(This is SupplyFlow's `explode()` engine — a real differentiator.)*
4. **Manual supplier ordering** — no automated par-based reorder tied to actual depletion.
5. **POS-to-procurement gap** — sales happen in POS, but few tools close the loop:
   *sale → depletion → reorder*.
6. **Demand forecasting** — almost everyone markets "AI"; few deliver accurate, explainable
   per-item forecasts.
7. **Painful stock counts** — slow, error-prone, often performed offline in walk-in coolers
   with no signal.

---

## 4. Gaps & Where SupplyFlow Can Differentiate

SupplyFlow's architecture maps unusually well to the underserved gaps:

- 🟢 **BOM explosion engine** (nested sub-recipes, yield divisors, waste %, cycle detection) —
  genuinely better than most SMB competitors. **Lead with this.**
- 🟢 **POS → depletion → AI → PO pipeline** — closing the sale-to-reorder loop end-to-end is
  the holy grail few do well.
- 🟢 **Offline-first mobile counts** (WatermelonDB sync) — directly solves the walk-in-cooler
  no-signal pain; most competitors are online-only web apps.
- 🟢 **AI-driven forecasting** as a first-class citizen (`apps/ml`) rather than bolted on.
- 🟢 **Multi-tenant + RLS from day one** — clean path to multi-location chains and a potential
  white-label/partner channel.

**Underserved segment:** independent multi-location operators and small regional chains
(**3–30 locations**) — too big for spreadsheets, too small/cost-sensitive for
Crunchtime/R365 enterprise pricing, and poorly served by single-location SMB tools.

---

## 5. Buying Criteria & Integration Requirements

- **POS integrations are table stakes** — Toast, Square, Clover, Lightspeed. Without sales-data
  ingestion you cannot do depletion/forecasting. **Execute connectors in order (DialTone,
  then Toast, then Square) and go deep at each stage instead of adding shallow breadth.**
- **Accounting integrations** — QuickBooks, Xero, Sage. (R365's moat is being the accounting
  system itself.)
- **Supplier connectivity** — EDI / supplier catalogs / order transmission (US Foods, Sysco,
  regional distributors). Hard but sticky.
- **Time-to-value** — onboarding (recipe + supplier catalog setup) is the #1 churn/adoption
  killer. Invoice OCR and catalog import matter.
- **Pricing model** — per-location pricing is the norm; buyers evaluate ROI against
  food-cost savings.

---

## 6. Opportunity Assessment & Positioning

**Verdict: Validated, crowded, but with a defensible wedge.** This is a real, growing market
with willing buyers and clear ROI — but it is contested by well-funded incumbents. A
horizontal "another inventory app" loses. A **sharp wedge wins.**

**Recommended positioning:**

> *"The AI supply-chain brain for multi-location restaurants — from POS sale to purchase
> order, automatically."*

**Strategic priorities:**

1. **Wedge on the BOM-engine + POS-to-PO automation loop** — strongest, hardest-to-copy
   assets. Don't lead with generic "inventory management."
2. **Target the 3–30 location mid-gap** — underserved by both ends of the market.
3. **Execute connector rollout as DialTone → Toast → Square** — depth of integration beats breadth.
4. **Market offline mobile counts as a headline feature**, not a footnote — a tangible
   daily-pain solver.
5. **Make AI explainable** — "here's *why* we suggest reordering 12 cases" beats a black box;
   explainability is a trust differentiator vs. incumbent "AI" claims.

**Biggest risks:**

- (a) Toast/Square bundling BOH for free.
- (b) Onboarding friction killing adoption.
- (c) Integration maintenance burden across POS systems and suppliers.

---

## 7. Next Steps

- [ ] Re-run **live, cited research** to firm up market-size figures and current competitor
      pricing with verifiable sources.
- [ ] Validate the 3–30-location segment hypothesis via operator interviews.
- [ ] Map required POS integration (Toast vs. Square) against target-segment install base.
- [ ] Fold validated findings into [`docs/PRD-SupplyFlow.md`](PRD-SupplyFlow.md).
