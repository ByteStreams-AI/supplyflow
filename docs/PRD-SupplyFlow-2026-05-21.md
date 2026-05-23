# PRD — SupplyFlow

> **Real-Time Supply for Real-World Kitchens**

|                  |                                           |
| ---------------- | ----------------------------------------- |
| **Product**      | SupplyFlow                                |
| **Document**     | Product Requirements Document             |
| **Version**      | 0.1 — Draft                               |
| **Date**         | 2026-05-21                                |
| **Author**       | Product (with PRD Creation Assistant)     |
| **Source notes** | `notes/projects/supplyflow/SupplyFlow.md` |
| **Status**       | For review                                |

---

## 1. App Overview & Objectives

### 1.1 Summary

SupplyFlow is a **multi-tenant SaaS** restaurant supply-chain platform. It gives independent
restaurants and small chains real-time control over procurement, inventory, warehousing,
logistics, and food cost — driven by actual sales rather than guesswork. Every menu item is
backed by a **Bill of Materials (BOM)**, so when a sale happens, stock is depleted to the
ingredient level automatically and true plate cost is always known.

SupplyFlow is **AI-forward**: predictive sourcing, demand forecasting, price-trend modeling,
and shortage detection are headline capabilities from launch, not a later add-on.

### 1.2 Problem Statement

Restaurants operate on thin margins (typically 3–9% net) and lose money to invisible
supply-chain friction:

- Stock counts are manual, stale, and disconnected from sales.
- Food cost is calculated monthly (or never), so menu pricing drifts behind ingredient prices.
- Emergency orders, sole-sourcing, and price volatility quietly erode margin.
- Waste and over-ordering tie up cash.
- Owners have no forward view of price spikes or supply shortages.

### 1.3 Product Objectives

Derived directly from the source notes:

| #   | Objective                    | What success looks like                                                                                                                                            |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| O1  | **Procurement**              | Source goods across multiple vetted vendors; no sole-sourcing; support fast just-in-time (JIT) ordering; absorb price volatility.                                  |
| O2  | **Inventory Management**     | Live stock across all sales channels; 80/20 prioritization of profitable items; sales-driven depletion via BOM; less waste, fewer emergency orders, freed-up cash. |
| O3  | **Warehousing**              | Safe, organized storage; fast, accurate picking and receiving.                                                                                                     |
| O4  | **Logistics & Distribution** | Reliable transport and delivery of goods, including inter-location transfers.                                                                                      |
| O5  | **Predictive Source Trends** | Forecast pricing trends and supply shortages before they hit the kitchen.                                                                                          |
| O6  | **Cost Controls**            | Always-current cost of any finished good or menu item based on live ingredient pricing.                                                                            |

### 1.4 Non-Goals (v1)

- Not a full accounting/ERP system (integrate, don't replace).
- Not a third-party POS integration in v1 — sales come from **DialTone** (see §3.7). Generic
  POS connectors are a planned future channel.
- Not a payroll, scheduling, or HR tool.
- Not a consumer-facing ordering app.

---

## 2. Target Audience

### 2.1 Primary Customers

- **Independent restaurants** (1 location) wanting real food-cost control.
- **Small multi-location groups / regional chains** (2–15 locations) needing consolidated
  purchasing, inter-location transfers, and a central commissary view.
- Operators already using — or adopting — **DialTone** for voice-AI phone ordering, who want
  their order stream to drive inventory automatically.

### 2.2 User Roles (Personas)

| Role                      | Primary jobs in SupplyFlow                                                |
| ------------------------- | ------------------------------------------------------------------------- |
| **Owner / Operator**      | Margin, cost trends, vendor strategy, multi-location rollups, billing.    |
| **General Manager**       | Approvals, par levels, vendor selection, location-level reporting.        |
| **Purchasing / Buyer**    | Build and send POs, negotiate, compare vendor pricing, manage lead times. |
| **Kitchen / Chef**        | Maintain recipes and BOMs, log waste, request items, run prep.            |
| **Receiving / Warehouse** | Receive deliveries, pick/transfer stock, run counts, manage bins.         |
| **Viewer / Accountant**   | Read-only reporting, cost exports, invoice reconciliation.                |

### 2.3 Tenancy Model

Each restaurant business is a **tenant (organization)**. A tenant owns one or more
**locations** (restaurant sites and/or warehouses/commissaries). All data is strictly isolated
per tenant. Users belong to a tenant and are scoped to one or more locations with a role.

---

## 3. Core Features & Functionality

Each module below lists **capabilities**, **acceptance criteria**, and **technical
considerations** for engineering handoff. Modules map to development sprints (see §9).

### 3.1 Module A — Multi-Tenant Foundation & Access Control

**Capabilities**

- Tenant (organization) provisioning and onboarding wizard.
- Location management (sites, warehouses/commissaries).
- User invitation, role assignment, and per-location scoping.
- Subscription billing and plan limits (Stripe).
- Audit log of sensitive actions (PO approval, price changes, count adjustments).

**Acceptance Criteria**

- A new tenant can self-onboard: create org → add first location → invite users → start trial.
- A user assigned the *Receiving* role at Location A cannot view or mutate Location B data.
- All tenant data access is enforced at the database layer (row-level security), not only the API.
- A tenant exceeding its plan's location/user limit is blocked with a clear upgrade prompt.
- Every PO approval, price override, and inventory adjustment writes an immutable audit record
  (actor, timestamp, before/after values).

**Technical Considerations**

- Tenant isolation via Postgres **Row-Level Security (RLS)**; every domain table carries a
  non-null `tenant_id`. JWT claims (`tenant_id`, `role`, `location_ids`) drive policies.
- Billing: Stripe Customer + Subscription per tenant; plan entitlements cached in the tenant record.
- Reuse the ByteStreams stack conventions (Supabase, Stripe, Resend) for consistency with DialTone.

### 3.2 Module B — Catalog & Bill of Materials (BOM)

The **BOM is the backbone of SupplyFlow.** It maps every menu item down to exact ingredients,
sub-recipes, and packaging.

**Capabilities**

- **Items** — the inventory unit: raw ingredients, prepped sub-recipe outputs, packaging, and
  finished goods. Each item has a stocking unit, purchase unit, and conversion factor.
- **Sub-recipes (prep items)** — e.g., "house marinara," "pizza dough" — produced from other
  items, themselves consumable by menu items. Sub-recipes can nest.
- **Menu items** — sellable products, each with a BOM that lists components (items + sub-recipes
  + packaging) and quantities, including expected **yield** and **waste/shrinkage %**.
- Unit-of-measure (UoM) system with conversions (e.g., case → lb → oz).
- Recipe versioning — editing a BOM creates a new version; historical costs reference the
  version active at the time.
- Item images, allergen tags, and storage requirements (refrigerated/frozen/dry).

**Acceptance Criteria**

- A menu item's BOM can reference raw items, nested sub-recipes, and packaging in one structure.
- Editing a BOM produces a new immutable version; prior cost snapshots remain accurate.
- A "BOM explosion" of any menu item returns the full flattened list of raw items and total
  quantity per raw item, accounting for nested sub-recipes and waste %.
- UoM conversion is enforced: a recipe in ounces and a purchase in cases reconcile correctly.
- Circular sub-recipe references are detected and rejected at save time.

**Technical Considerations**

- BOM is a directed acyclic graph (DAG). Store as `recipe_component` edges; resolve recursively.

- BOM explosion (also used by depletion §3.7 and costing §3.8):
  
  ```
  function explode(menuItem, qtySold):
      result = {}                       # raw_item_id -> total_qty
      stack = [(component, qtySold) for component in menuItem.bom]
      while stack not empty:
          (component, multiplier) = stack.pop()
          effectiveQty = component.qty * multiplier * (1 + component.waste_pct)
          if component.item.is_sub_recipe:
              for child in component.item.bom:
                  stack.push((child, effectiveQty / component.item.yield))
          else:
              result[component.item.id] += effectiveQty
      return result
  ```

- Cache exploded BOMs per recipe version; invalidate on new version.

### 3.3 Module C — Procurement (Objective O1)

**Capabilities**

- **Vendor management** — vendor profiles, contacts, payment terms, delivery windows,
  minimum order values, lead times, and reliability score.
- **Multi-vendor sourcing** — every purchasable item maps to one or more **vendor products**
  (vendor SKU, pack size, price, lead time). The system flags items with only one active
  vendor as a **sole-sourcing risk** and prompts for a backup.
- **Purchase Orders** — create POs manually, from low-stock suggestions, or from a forecast
  (§3.9). Multi-vendor cart splits one shopping list into per-vendor POs.
- **JIT ordering** — par-level/reorder-point logic plus lead-time-aware suggested order dates;
  one-tap reorder from mobile.
- **Price-volatility handling** — vendor price comparison at PO time; price-change alerts;
  contract/locked-price tracking; "best value" recommendation considering price, pack size,
  lead time, and vendor reliability.
- PO lifecycle: Draft → Pending Approval → Sent → Partially Received → Received → Closed.
- Send POs to vendors by email (PDF) or vendor portal link.

**Acceptance Criteria**

- A buyer can build a shopping list and have it auto-split into one PO per vendor.
- Any item sourced from exactly one vendor is visibly flagged as a sole-source risk.
- Suggested order quantity respects reorder point, par level, pack/case size, and vendor MOQ.
- Suggested order *date* accounts for vendor lead time so stock arrives before depletion.
- A price change >X% (tenant-configurable threshold) since last purchase triggers an alert.
- POs above a configurable value require approval before they can be sent.

**Technical Considerations**

- Vendor reliability score = function of on-time delivery %, fill rate, and price stability;
  recomputed on each goods receipt.
- "Best value" ranking is a weighted score; weights are tenant-configurable.
- PO PDF generation server-side; delivery via Resend (consistent with DialTone email infra).

### 3.4 Module D — Inventory Management (Objective O2)

**Capabilities**

- **Real-time stock levels** per item per location, across all sales channels.
- **Sales-driven depletion** — completed sales explode through the BOM and decrement raw
  stock (see §3.7 for the DialTone feed).
- **80/20 (ABC) analysis** — classify items by contribution to revenue/profit; surface the
  ~20% of items driving ~80% of value so attention and capital focus there.
- **Inventory balance tools:**
  - *Waste reduction* — waste/spoilage logging with reason codes and cost impact.
  - *Cash-constraint relief* — flag overstock and slow-movers tying up cash.
  - *Emergency-order reduction* — proactive low-stock and forecast alerts.
  - *Substitutions* — maintain approved substitute items; suggest a substitute when a primary
    item is short or unavailable.
- **Par levels & reorder points** per item per location, manually set or AI-suggested (§3.9).
- **Physical counts** — full and cycle counts; mobile count sheets; variance reporting
  (theoretical vs. actual) with shrinkage cost.
- **Inventory transactions** — an append-only ledger: receipt, sale-depletion, waste, transfer,
  adjustment, count-correction, production (sub-recipe make).

**Acceptance Criteria**

- On-hand quantity for any item/location is derivable purely from the transaction ledger.
- A completed sale of a menu item decrements every raw component per its BOM within seconds.
- ABC classification recalculates on a schedule and on demand, ranking items A/B/C.
- Logging waste records quantity, reason, and computed cost, and decrements stock.
- A cycle count produces a variance report and, on confirmation, a count-correction transaction.
- When an item falls below reorder point, an alert is raised and a draft PO line is suggested.
- When a primary item is out of stock, configured substitutes are surfaced in context.

**Technical Considerations**

- **Event-sourced inventory:** never mutate a balance directly — append a transaction; current
  balance is a maintained projection (materialized view or incrementally-updated counter).
- Costing method: **weighted-average cost (WAC)** per item, updated on each receipt; the design
  must not preclude moving to FIFO later.
- Live updates to clients via Supabase Realtime / WebSocket subscriptions on stock projections.
- ABC analysis is a scheduled job (Cloudflare Cron) writing a classification per item.

### 3.5 Module E — Warehousing (Objective O3)

**Capabilities**

- **Storage structure** — locations contain storage areas/zones (walk-in, freezer, dry storage,
  bar) and optional bins/shelves. Supports a central **commissary/warehouse** for groups.
- **Receiving workflow** — receive against a PO on mobile: scan/confirm items, capture
  quantities, note discrepancies, photograph delivery/invoice, put away to a bin.
- **Picking** — generate pick lists for inter-location transfers and commissary fulfillment;
  mobile pick confirmation.
- **Storage compliance** — surface storage requirements (temp zone) and flag mis-stored or
  expiring items; optional lot/expiry tracking for date-sensitive goods.

**Acceptance Criteria**

- A delivery can be received on mobile against its PO, including partial and over-receipts.
- Receiving discrepancies (short, over, damaged, wrong item) are recorded against the PO.
- A pick list can be generated for a transfer request and confirmed item-by-item on mobile.
- Items with expiry dates surface a near-expiry alert before the configured window.

**Technical Considerations**

- Bin/zone hierarchy is optional per tenant — small single-site restaurants can ignore it;
  commissary operations can use the full hierarchy.
- Barcode/QR scanning via the native mobile app camera (see §4 Platform).
- Delivery/invoice photos stored in object storage (Supabase Storage or Cloudflare R2).

### 3.6 Module F — Logistics & Distribution (Objective O4)

**Capabilities**

- **Inbound deliveries** — expected delivery calendar from open POs; delivery-window tracking;
  on-time/late recording feeding vendor reliability.
- **Inter-location transfers** — request, approve, pick, ship, and receive stock between a
  tenant's locations/commissary; transfers move cost with the goods.
- **Delivery tracking** — status (Scheduled → In Transit → Delivered) with timestamps; optional
  driver/route notes for tenants running their own distribution.
- **Exception handling** — late, partial, or failed deliveries raise alerts and can trigger a
  substitution or emergency-sourcing suggestion.

**Acceptance Criteria**

- A transfer between two locations produces matching outbound and inbound transactions and
  moves item cost correctly.
- An open PO appears on a delivery calendar with its expected window.
- A late or missed delivery raises an alert and is reflected in the vendor's reliability score.

**Technical Considerations**

- Transfers are two linked inventory transactions (out at source, in at destination) plus a
  transfer record holding status and timestamps.
- v1 logistics is operational tracking, not route optimization; third-party carrier/route APIs
  are a future phase (§11).

### 3.7 Module G — DialTone Integration & Sales-Driven Depletion

**This is the v1 sales channel.** Instead of integrating third-party POS systems, SupplyFlow
consumes completed orders from **DialTone** (`dialtone.menu`) — the ByteStreams voice-AI phone
ordering agent for restaurants.

**Capabilities**

- **Order ingestion** — receive each completed/paid DialTone order as an event.
- **Menu mapping** — a mapping layer links each DialTone menu item to a SupplyFlow menu item
  (and therefore its BOM). Unmapped items are quarantined for the user to resolve.
- **Depletion** — each ingested order line is BOM-exploded (§3.2) and posted as
  sale-depletion transactions against the originating location's stock.
- **Reconciliation** — a sales/depletion view ties DialTone revenue to ingredient consumption
  and theoretical cost.

**Acceptance Criteria**

- A completed DialTone order results in correct raw-ingredient depletion at the right location
  within seconds, with idempotency (a replayed order is not double-counted).
- A DialTone menu item with no SupplyFlow mapping does **not** silently drop — it is queued as
  an "unmapped item" exception with a clear resolution prompt.
- The depletion for an order is traceable back to the source DialTone order ID.

**Technical Considerations**

- DialTone runs on **Cloudflare Workers + Supabase + Stripe**. The DialTone
  **order-completed webhook is in active development**; v1 integration targets it as the
  primary path. A scheduled cross-project pull is retained as a contingency if the webhook
  is not ready by Phase 3.
- SupplyFlow runs its **own separate Supabase project** — it does **not** share DialTone's
  database. Integration is via the webhook/API only. This keeps SupplyFlow's schema
  independent and free to add generic POS channels later without coupling to DialTone.
- **Idempotency:** store `source_system` + `source_order_id`; ingestion is upsert-keyed on it.
- A mapping table `channel_item_map (tenant, channel, external_item_id → menu_item_id)`
  decouples DialTone's menu identifiers from SupplyFlow's catalog.
- Design the ingestion endpoint channel-agnostic so generic POS connectors (Toast, Square,
  Clover) can be added later (§11) without reworking depletion.

### 3.8 Module H — Cost Controls (Objective O6)

**Capabilities**

- **Live plate cost** — current cost of any menu item = BOM explosion × current item costs.
- **Theoretical food cost %** — plate cost vs. menu price, per item and rolled up.
- **Cost history & drift** — track how plate cost moves as ingredient prices change; alert when
  an item's food-cost % crosses a target threshold.
- **Margin dashboard** — contribution margin per menu item, combined with ABC class (§3.4) to
  highlight high-volume/low-margin items.
- **Repricing guidance** — suggested menu price to hold a target food-cost %.
- **Cost snapshots** — periodic point-in-time costing for period-over-period comparison.

**Acceptance Criteria**

- Plate cost for any menu item is recomputed whenever a component item's cost changes.
- Food-cost % is shown per menu item and as a weighted rollup by sales mix.
- When an item's food-cost % exceeds its target, the owner is alerted with the price/margin gap.
- A historical cost snapshot reflects the item costs and BOM versions in effect at that time.

**Technical Considerations**

- Plate cost reuses the BOM-explosion routine (§3.2) with current WAC per raw item.
- Sales-mix weighting uses ingested DialTone order volume (§3.7).
- Cost snapshots are immutable rows keyed by date + BOM version + item-cost vector.

### 3.9 Module I — Predictive Intelligence / AI (Objective O5)

SupplyFlow is **AI-forward in v1.** Four AI capabilities ship at launch:

**1. Demand Forecasting**

- Forecast menu-item and ingredient demand per location.
- Inputs: historical DialTone sales, day-of-week/seasonality, holidays, local events, weather.
- Outputs: suggested par levels, reorder points, and order quantities feeding Procurement (§3.3).

**2. Price-Trend Prediction**

- Model ingredient price trajectories from SupplyFlow's own `price_history` plus external
  commodity/wholesale indices.
- Outputs: "buy now vs. wait" guidance, forward price ranges, and budget impact estimates.

**3. Supply-Shortage / Disruption Detection**

- Detect emerging shortages and supply disruptions from price anomalies, vendor fill-rate
  drops, lead-time increases, and external signals.
- Outputs: early-warning alerts with recommended actions (pre-buy, switch vendor, substitute).

**4. AI Assistant & Document Intelligence (LLM layer)**

- Natural-language insights and Q&A over the tenant's supply data
  ("Why did my food cost rise last week?").
- **Invoice/document extraction** — parse vendor invoices and order guides (PDF/photo) into
  structured line items and prices to update `price_history` with minimal typing.
- Draft purchase orders and substitution recommendations in natural language.

**Acceptance Criteria**

- Each forecast carries a confidence indicator and the period it covers.
- AI-suggested par levels/reorder points are *suggestions* — a human can accept, edit, or
  reject; nothing auto-orders without the tenant explicitly enabling it.
- Price-trend output gives a directional call (up/down/stable) with a forward range.
- A shortage alert names the item, the signal that triggered it, and a recommended action.
- Invoice extraction returns structured line items for human confirmation before they post.
- All AI outputs are explainable: the user can see which inputs drove a recommendation.

**Technical Considerations**

- **Forecasting models:** start with strong classical baselines (seasonal-naïve, Prophet-style
  decomposition) and gradient-boosted models (e.g., LightGBM) with calendar/weather features;
  per-tenant models trained on their own history. Cold-start uses category-level priors until
  enough tenant history accrues.
- **Price/shortage models:** time-series + anomaly detection; enrich with external commodity
  and weather feeds via a pluggable data-source layer.
- **LLM layer:** use the **Claude API** (Opus/Sonnet) for natural-language insight, PO drafting,
  and invoice/order-guide extraction (Claude vision for document parsing). Apply **prompt
  caching** to the tenant's catalog/BOM context to control cost and latency.
- **Serving:** a dedicated Python ML service (FastAPI) for training/inference, separate from the
  core API; scheduled retraining via Cron; predictions written back to Postgres for the app to read.
- **Guardrails:** AI never mutates inventory or sends a PO autonomously in v1 — it proposes,
  humans dispose.

---

## 4. Platform

**Web + native mobile**, per product decision.

| Surface                           | Purpose                                                                                              | Notes                                                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web app**                       | Back-office: procurement, BOM/recipe editing, dashboards, cost controls, AI insights, admin/billing. | Responsive; primary surface for owners/buyers/chefs.                                                                                                                                                 |
| **Native mobile (iOS + Android)** | On-the-floor: receiving, counts, picking, transfers, waste logging, one-tap reorder, alerts.         | **Barcode/QR scanning** and **camera invoice capture** require native. Must work in walk-ins/storerooms with **poor connectivity** — offline-capable for counts and receiving, syncing on reconnect. |

---

## 5. Technical Stack Recommendations

Recommendations favor consistency with the existing **ByteStreams / DialTone** stack to share
infrastructure, billing, and operational knowledge.

| Layer                 | Recommendation                                                                         | Rationale / Alternatives                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database**          | **Supabase (PostgreSQL)** with Row-Level Security — **separate project from DialTone** | RLS gives strong multi-tenant isolation; Realtime powers live stock. SupplyFlow owns its own database; no shared schema with DialTone. *Alt: Neon + custom auth — more work.* |
| **Core API**          | **TypeScript** API — Hono on **Cloudflare Workers**                                    | Edge-deployed, same platform as DialTone; great DX. *Alt: NestJS on a container host if the domain logic outgrows Workers limits.*                                            |
| **AI/ML service**     | **Python + FastAPI**, separate service                                                 | Forecasting/ML ecosystem (LightGBM, Prophet, statsmodels) is Python-first. Deploy on Cloudflare Containers or Fly.io.                                                         |
| **LLM**               | **Claude API** (Opus/Sonnet) with prompt caching                                       | Insight generation, PO drafting, invoice/document extraction (vision).                                                                                                        |
| **Web frontend**      | **React + TypeScript** (Vite)                                                          | Large ecosystem; shares TypeScript domain types with API and mobile. *Alt: SvelteKit.*                                                                                        |
| **Mobile**            | **React Native (Expo)**                                                                | Shares TypeScript/domain code with web; mature barcode-scanning and camera modules; OTA updates. *Alt: Flutter — better raw perf, separate language.*                         |
| **Auth**              | **Supabase Auth** — email/password + OAuth (Google/Apple)                              | JWT carries `tenant_id`/`role`/`location_ids` for RLS.                                                                                                                        |
| **Billing**           | **Stripe** subscriptions                                                               | Same as DialTone; per-tenant customer + subscription.                                                                                                                         |
| **Email**             | **Resend** (`send.bytestreams.ai`)                                                     | Same sending domain/infra as DialTone; PO emails, alerts.                                                                                                                     |
| **Push / SMS**        | **Expo Push** (mobile alerts); Twilio optional for SMS                                 | Low-stock, delivery, and shortage alerts.                                                                                                                                     |
| **Object storage**    | **Supabase Storage** or **Cloudflare R2**                                              | Invoice/delivery photos, item images, PO PDFs.                                                                                                                                |
| **Jobs / scheduling** | **Cloudflare Cron Triggers + Queues**                                                  | ABC analysis, forecast runs, reorder checks, DialTone pull fallback.                                                                                                          |
| **Observability**     | Cloudflare Workers logs/traces; error tracking (Sentry)                                | Mirror DialTone observability config.                                                                                                                                         |

> Documentation references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
> [Hono on Cloudflare](https://hono.dev/getting-started/cloudflare-workers),
> [Expo](https://docs.expo.dev/), [Stripe Billing](https://stripe.com/docs/billing),
> [Anthropic Claude API](https://docs.anthropic.com/).

---

## 6. Conceptual Data Model

Every domain table carries a non-null `tenant_id` (RLS scope). Types are conceptual.

### 6.1 Tenancy & Access

- **tenant** — `id (uuid)`, `name (string)`, `plan (enum)`, `stripe_customer_id (string)`,
  `status (enum)`, `created_at (timestamptz)`.
- **location** — `id`, `tenant_id → tenant`, `name`, `type (enum: restaurant|warehouse|commissary)`,
  `address (jsonb)`, `timezone (string)`.
- **user** — `id`, `tenant_id → tenant`, `email (string, unique)`, `name`, `auth_uid (string)`.
- **user_location_role** — `user_id → user`, `location_id → location`,
  `role (enum: owner|manager|buyer|kitchen|receiving|viewer)`.
- **audit_log** — `id`, `tenant_id`, `actor_user_id`, `action (string)`, `entity (string)`,
  `entity_id`, `before (jsonb)`, `after (jsonb)`, `created_at`.

### 6.2 Catalog & BOM

- **item** — `id`, `tenant_id`, `name`, `type (enum: raw|sub_recipe|packaging|finished_good)`,
  `category (string)`, `stock_uom (string)`, `purchase_uom (string)`,
  `purchase_to_stock_factor (numeric)`, `storage_zone (enum: dry|refrigerated|frozen)`,
  `allergens (string[])`, `is_active (bool)`.
- **menu_item** — `id`, `tenant_id`, `name`, `menu_price (numeric)`,
  `target_food_cost_pct (numeric)`, `is_active (bool)`.
- **recipe_version** — `id`, `tenant_id`, `owner_type (enum: menu_item|sub_recipe)`,
  `owner_id`, `version_no (int)`, `yield_qty (numeric)`, `yield_uom (string)`,
  `is_current (bool)`, `created_at`.
- **recipe_component** — `id`, `recipe_version_id → recipe_version`,
  `component_item_id → item` *(raw or sub_recipe)*, `qty (numeric)`, `uom (string)`,
  `waste_pct (numeric)`. *(BOM edges; DAG.)*
- **substitution** — `id`, `tenant_id`, `primary_item_id → item`,
  `substitute_item_id → item`, `ratio (numeric)`, `notes`.

### 6.3 Procurement & Vendors

- **vendor** — `id`, `tenant_id`, `name`, `contacts (jsonb)`, `payment_terms (string)`,
  `min_order_value (numeric)`, `delivery_windows (jsonb)`, `reliability_score (numeric)`,
  `is_active (bool)`.
- **vendor_product** — `id`, `tenant_id`, `vendor_id → vendor`, `item_id → item`,
  `vendor_sku (string)`, `pack_description (string)`, `pack_qty_in_purchase_uom (numeric)`,
  `current_price (numeric)`, `lead_time_days (int)`, `is_active (bool)`.
- **price_history** — `id`, `tenant_id`, `vendor_product_id → vendor_product`,
  `price (numeric)`, `effective_date (date)`, `source (enum: po|invoice|manual|feed)`.
- **purchase_order** — `id`, `tenant_id`, `location_id → location`, `vendor_id → vendor`,
  `status (enum: draft|pending_approval|sent|partially_received|received|closed|cancelled)`,
  `expected_delivery (date)`, `subtotal (numeric)`, `created_by → user`, `approved_by → user`.
- **purchase_order_line** — `id`, `purchase_order_id → purchase_order`,
  `vendor_product_id → vendor_product`, `qty_ordered (numeric)`, `qty_received (numeric)`,
  `unit_price (numeric)`.

### 6.4 Inventory, Warehousing & Logistics

- **storage_area** — `id`, `tenant_id`, `location_id → location`, `name`,
  `zone (enum: dry|refrigerated|frozen|bar)`, `parent_area_id → storage_area (nullable)`.
- **stock_level** *(projection)* — `tenant_id`, `location_id`, `item_id`,
  `on_hand_qty (numeric)`, `avg_cost (numeric)`, `reorder_point (numeric)`,
  `par_level (numeric)`, `updated_at`. *(Derived from `inventory_transaction`.)*
- **inventory_transaction** *(append-only ledger)* — `id`, `tenant_id`, `location_id`,
  `item_id → item`,
  `txn_type (enum: receipt|sale_depletion|waste|transfer_out|transfer_in|adjustment|count_correction|production)`,
  `qty_delta (numeric)`, `unit_cost (numeric)`, `reason_code (string, nullable)`,
  `ref_type (string)`, `ref_id (uuid)`, `created_by → user`, `created_at`.
- **goods_receipt** — `id`, `tenant_id`, `purchase_order_id → purchase_order`,
  `received_by → user`, `received_at`, `discrepancies (jsonb)`, `photo_urls (string[])`.
- **stock_count** — `id`, `tenant_id`, `location_id`, `type (enum: full|cycle)`,
  `status (enum: open|submitted|reconciled)`, `created_by`, `created_at`.
- **stock_count_line** — `id`, `stock_count_id → stock_count`, `item_id → item`,
  `counted_qty (numeric)`, `theoretical_qty (numeric)`, `variance_qty (numeric)`.
- **transfer** — `id`, `tenant_id`, `from_location_id`, `to_location_id`,
  `status (enum: requested|approved|picked|in_transit|received|cancelled)`,
  `lines (jsonb: item_id, qty)`, timestamps.

### 6.5 Sales, Cost & AI

- **sales_order** — `id`, `tenant_id`, `location_id`, `source_system (enum: dialtone|...)`,
  `source_order_id (string)`, `ordered_at (timestamptz)`, `gross_revenue (numeric)`,
  `status (enum: ingested|depleted|exception)`. *(Unique on `source_system` + `source_order_id`.)*
- **sales_order_line** — `id`, `sales_order_id → sales_order`, `menu_item_id → menu_item`,
  `qty (numeric)`, `line_revenue (numeric)`.
- **channel_item_map** — `id`, `tenant_id`, `channel (enum: dialtone|...)`,
  `external_item_id (string)`, `menu_item_id → menu_item`.
- **cost_snapshot** — `id`, `tenant_id`, `menu_item_id`, `recipe_version_id`,
  `plate_cost (numeric)`, `food_cost_pct (numeric)`, `snapshot_date (date)`.
- **abc_classification** — `tenant_id`, `item_id` / `menu_item_id`,
  `class (enum: A|B|C)`, `value_contribution (numeric)`, `computed_at`.
- **forecast** — `id`, `tenant_id`, `location_id`, `target_type (enum: item|menu_item)`,
  `target_id`, `period_start (date)`, `period_end (date)`, `predicted_qty (numeric)`,
  `confidence (numeric)`, `model_version (string)`, `created_at`.
- **insight_alert** — `id`, `tenant_id`, `type (enum: low_stock|price_spike|shortage|food_cost|expiry)`,
  `severity (enum)`, `payload (jsonb)`, `status (enum: open|ack|resolved)`, `created_at`.

### 6.6 Key Relationships (text ERD)

```
tenant 1─* location 1─* storage_area
tenant 1─* user *─* location               (via user_location_role)
menu_item 1─* recipe_version 1─* recipe_component *─1 item
item 1─* recipe_component                   (item used as a component; sub_recipe items nest)
item 1─* vendor_product *─1 vendor
vendor_product 1─* price_history
vendor 1─* purchase_order 1─* purchase_order_line *─1 vendor_product
purchase_order 1─1 goods_receipt
item 1─* inventory_transaction *─1 location  (ledger → stock_level projection)
sales_order 1─* sales_order_line *─1 menu_item
channel_item_map: (channel, external_item_id) ─1 menu_item
menu_item 1─* cost_snapshot ; menu_item/item 1─* forecast, abc_classification
```

---

## 7. UI Design Principles

- **Speed over polish on mobile.** Receiving, counts, and waste logging happen in cold,
  busy, gloved-hands environments — large tap targets, minimal typing, scan-first.
- **Decision-first dashboards.** The web home is "what needs my attention today": low stock,
  price spikes, shortage alerts, food-cost breaches — each with a one-click action.
- **The 80/20 lens everywhere.** A-class items are visually prioritized in lists and reports.
- **AI as a suggester, not a controller.** Predictions and recommendations are clearly labeled,
  show their reasoning, and always require human confirmation in v1.
- **Offline honesty.** The mobile app clearly indicates unsynced data and sync status.
- **Progressive disclosure.** A single-site restaurant never sees commissary/transfer/bin
  complexity unless it enables it.
- **Consistent terminology** with this PRD (item, menu item, BOM, vendor product, transaction)
  so UI labels map directly to data and code.
- **Accessibility:** WCAG 2.1 AA — contrast, keyboard navigation, screen-reader labels.

---

## 8. Security Considerations

- **Tenant isolation** enforced at the database via Postgres RLS on every table; the API never
  relies on application-layer checks alone. JWT claims (`tenant_id`, `role`, `location_ids`)
  drive policies.
- **Role-based access control** scoped per location (§3.1).
- **Authentication:** Supabase Auth; email/password + OAuth; enforce strong passwords; offer
  MFA for owner/manager roles; short-lived JWTs with refresh rotation.
- **Secrets management:** all keys (Supabase service role, Stripe, Resend, Claude API) stored
  as platform secrets (Cloudflare/Worker secrets), never in git — mirror DialTone's practice.
- **Audit trail:** immutable `audit_log` for PO approvals, price overrides, and inventory
  adjustments.
- **Webhook security:** the DialTone ingestion endpoint verifies a signed secret/HMAC and is
  idempotent to prevent replay/double-depletion.
- **Rate limiting** on public endpoints (ingestion, auth) — reuse DialTone's KV-backed pattern.
- **Data protection:** TLS in transit; encryption at rest (Supabase default); least-privilege
  service keys; PII limited to user/vendor contacts.
- **Billing integrity:** Stripe webhooks verified by signature; plan entitlements re-checked
  server-side.
- **Backups & recovery:** automated Postgres backups; documented restore procedure.
- **Privacy/compliance:** privacy policy and terms; data-export and deletion paths for tenants.

---

## 9. Development Phases / Milestones

A phased plan; each phase is releasable. Module letters refer to §3.

### Phase 0 — Foundation (Sprint 1–2)

- Module A: tenancy, locations, users/roles, RLS, Stripe billing skeleton.
- Project scaffolding: Supabase schema, API service, web + mobile shells, CI/CD.
- **Exit:** a tenant can sign up, add a location, invite users; isolation verified.

### Phase 1 — Catalog & Inventory Core (Sprint 3–5)

- Module B: items, sub-recipes, menu items, BOM editor, UoM, versioning, BOM explosion.
- Module D (core): inventory transaction ledger, stock-level projection, manual receipts,
  par/reorder points, waste logging.
- **Exit:** BOMs exist; stock can be received/adjusted; live balances are correct.

### Phase 2 — Procurement & Warehousing (Sprint 6–8)

- Module C: vendors, vendor products, multi-vendor POs, sole-source flagging, approvals,
  PO email/PDF.
- Module E: storage areas, mobile receiving against PO, picking, expiry alerts.
- **Exit:** a full procure-to-receive cycle works end to end.

### Phase 3 — DialTone Integration & Cost Controls (Sprint 9–10)

- Module G: order ingestion, menu mapping, BOM-driven depletion, idempotency, reconciliation.
- Module H: live plate cost, food-cost %, cost history, margin dashboard, snapshots.
- Module D (ABC): 80/20 classification.
- **Exit:** DialTone sales deplete inventory automatically; true food cost is live.

### Phase 4 — Logistics & Predictive AI (Sprint 11–14)

- Module F: inter-location transfers, delivery calendar, exception handling.
- Module I: demand forecasting, price-trend prediction, shortage detection, Claude-powered
  insights + invoice extraction; ML service and scheduled retraining.
- **Exit:** AI-forward v1 — predictive sourcing/forecasting live; full objective coverage O1–O6.

### Phase 5 — Hardening & Launch (Sprint 15–16)

- Offline sync hardening, performance, security review, accessibility, observability,
  onboarding polish, pilot with DialTone restaurants.

---

## 10. Potential Challenges & Solutions

| Challenge                                                                          | Risk                    | Mitigation                                                                                                             |
| ---------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **BOM data entry burden** — full recipe costing fails if BOMs aren't accurate.     | Adoption blocker.       | Onboarding wizard; Claude-assisted recipe/invoice import; category templates; start with A-class items only.           |
| **Unit-of-measure conversions** — cases↔lbs↔oz errors corrupt costs and stock.     | High.                   | Strict UoM model with explicit conversion factors; validation; conversions surfaced in UI.                             |
| **DialTone webhook timing** — the order-completed webhook is still in development. | Phase 3 schedule risk.  | Channel-agnostic ingestion; primary webhook path with a scheduled cross-project pull as contingency; idempotency keys. |
| **Forecast cold-start** — no per-tenant history at launch.                         | AI underdelivers early. | Category-level priors and classical baselines until tenant history accrues; show confidence.                           |
| **Inventory drift** — theoretical vs. actual diverges over time.                   | Trust erosion.          | Event-sourced ledger; cycle counts; variance reporting; never hide shrinkage.                                          |
| **Offline mobile in walk-ins/storerooms** — poor connectivity.                     | Data loss/UX.           | Offline-capable counts/receiving with local queue and conflict-aware sync.                                             |
| **Multi-tenant data leakage.**                                                     | Severe.                 | RLS on every table; automated isolation tests in CI; least-privilege keys.                                             |
| **AI cost/latency** (LLM + ML serving).                                            | Margin/UX.              | Prompt caching on catalog context; batch/scheduled inference; classical models where they suffice.                     |
| **Price-feed availability** for external commodity data.                           | Feature gap.            | Pluggable data-source layer; degrade gracefully to tenant's own `price_history`.                                       |

---

## 11. Future Expansion Possibilities

- **Generic POS connectors** — Toast, Square, Clover, Lightspeed via the channel-agnostic
  ingestion layer, beyond DialTone.
- **Vendor/supplier marketplace** — let vendors publish catalogs and bid on shopping lists.
- **Accounting integrations** — QuickBooks / Xero sync for invoices and COGS.
- **Route optimization & carrier APIs** for tenants running their own distribution.
- **EDI / vendor electronic ordering** for large distributors (Sysco, US Foods).
- **Auto-replenishment** — opt-in AI that places approved JIT orders within guardrails.
- **Sustainability & traceability** — lot tracking, food-safety logs, carbon/sourcing reporting.
- **Menu engineering** — recommend menu changes from margin + demand + price forecasts.
- **Benchmarking** — anonymized cross-tenant price and cost benchmarks.
- **Deeper ByteStreams ecosystem ties** — shared identity/billing with DialTone; a combined
  operator console.

---

## 12. Open Questions & Assumptions

**Confirmed decisions (2026-05-21 review)**

- **Sales channel:** DialTone is the v1 sales channel; its order-completed webhook is in
  active development. Generic POS integrations (Toast, Square, etc.) are a planned future
  channel — the ingestion layer is built channel-agnostic for this.
- **Database:** SupplyFlow runs its **own separate Supabase project**, not shared with
  DialTone; integration is via webhook/API only.
- **Pricing:** SupplyFlow will be sold in **multiple pricing tiers**; tier definitions and
  per-tier location/user limits are not yet decided.
- **Commissary/warehouse:** central commissary/warehouse operations **are in scope** for the
  first paying customers — Module E and inter-location transfers (Module F) ship in v1.

**Assumptions still in effect**

- Costing uses weighted-average cost in v1; FIFO/lot-costing is deferred.
- AI is advisory in v1 — no autonomous ordering.

**Open questions for review**

1. Pricing tiers — how many, and what are the per-tier location/user limits? (Plan
   entitlement logic in Module A depends on this.)
2. Which external price/commodity data feeds are licensable for the price-trend models?
3. Target launch customer count and the pilot cohort (DialTone pilot restaurants)?
4. Expected readiness date for the DialTone webhook — does it gate SupplyFlow's Phase 3, or
   should the pull-fallback be built proactively?

---

*End of PRD — SupplyFlow v0.1 (Draft).*
