# SupplyFlow — Tech Stack & Technical Approach

| | |
|---|---|
| **Document** | Tech Stack & Technical Approach |
| **Version** | 0.1 — Draft |
| **Date** | 2026-05-26 |
| **Source PRD** | `docs/PRD-SupplyFlow.md` |
| **Status** | For review |

---

## 1. Guiding Principles

1. **Consistency with the ByteStreams ecosystem** — share infrastructure, billing, auth, and operational patterns wherever it reduces cognitive overhead.
2. **Wedge-first execution** — prioritize the sale → depletion → reorder loop for the 3–30 location segment; depth on one POS connector first, breadth later.
3. **Edge-first API** — Cloudflare Workers for low-latency global deploys; no server management.
4. **Strong multi-tenant isolation** — Postgres RLS as the enforcement layer, not the application layer.
5. **Monorepo** — share TypeScript domain types, DB schemas, and the BOM engine across web, mobile, and API without duplication.
6. **Offline-capable mobile** — counts and receiving must survive walk-in connectivity loss.
7. **AI as a first-class layer** — ML and LLM are design inputs, not afterthoughts; the Python service and Claude integration are part of the baseline architecture.

---

## 2. Monorepo Structure

```
supplyflow/                          # pnpm workspaces + Turborepo
├── apps/
│   ├── web/                         # React + Vite web app
│   ├── mobile/                      # React Native + Expo mobile app
│   ├── api/                         # Hono on Cloudflare Workers (core API)
│   ├── ml/                          # Python FastAPI ML/AI service
│   └── jobs/                        # Cloudflare Workers cron jobs
├── packages/
│   ├── types/                       # Shared TypeScript domain types & Zod schemas
│   ├── db/                          # Drizzle schema, Supabase client factory, RLS helpers
│   ├── bom/                         # BOM explosion engine (pure TS, shared by api + web)
│   └── ui/                          # Shared design system (Radix UI + Tailwind)
├── supabase/                        # Supabase project config, migrations, RLS policies, seed
├── .github/                         # CI/CD workflows
└── turbo.json
```

**Why Turborepo + pnpm workspaces?** Turborepo provides incremental build caching so only changed packages rebuild; pnpm's strict hoisting prevents phantom dependency bugs across the workspace.

---

## 3. Full Tech Stack

### 3.1 Language & Runtime

| Layer | Language | Runtime |
|---|---|---|
| API / jobs | TypeScript 5.x | Cloudflare Workers (V8 isolates) |
| Web | TypeScript 5.x | Browser |
| Mobile | TypeScript 5.x | Hermes (React Native) |
| ML service | Python 3.12 | uvicorn / Cloudflare Containers or Fly.io |
| DB migrations | SQL | Supabase CLI |

### 3.2 Database

| Concern | Technology | Notes |
|---|---|---|
| Primary store | **Supabase (PostgreSQL 16)** | Separate project from DialTone |
| Multi-tenancy | **Postgres Row-Level Security** | Every domain table has `tenant_id NOT NULL`; JWT claims drive policies |
| ORM / query builder | **Drizzle ORM** | Typesafe, edge-compatible; generates TypeScript types from schema; schema lives in `packages/db` |
| Real-time | **Supabase Realtime** | Postgres CDC → WebSocket subscriptions for live stock-level updates |
| Object storage | **Supabase Storage** (primary) / **Cloudflare R2** (large files / CDN) | Invoice photos, PO PDFs, item images |
| Full-text search | Postgres `tsvector` + `GIN` index | Catalog item/vendor search; no external search service needed in v1 |

**Schema conventions:**
- Every tenant-scoped table: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`, `tenant_id UUID NOT NULL REFERENCES tenant(id)`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`.
- RLS enabled on all tenant tables; policies reference `auth.jwt() ->> 'tenant_id'`.
- Append-only tables (`inventory_transaction`, `audit_log`, `price_history`): no `UPDATE` or `DELETE` granted to any role.

### 3.3 Core API

| Concern | Technology | Notes |
|---|---|---|
| Framework | **Hono** | Lightweight, edge-native, excellent TypeScript support |
| Runtime host | **Cloudflare Workers** | Edge-deployed globally; consistent with DialTone |
| Validation | **Zod** | Request/response schema validation; schemas in `packages/types` |
| Auth middleware | Supabase JWT verification | JWT carries `tenant_id`, `role`, `location_ids`; injected into request context |
| Rate limiting | **Cloudflare KV** (sliding window) | Mirror DialTone's pattern |
| Background queues | **Cloudflare Queues** | PO email dispatch, BOM depletion fan-out, forecast triggers |
| Scheduled jobs | **Cloudflare Cron Triggers** | ABC classification, reorder-point sweeps, channel pull fallback (contingency) |
| PDF generation | **@react-pdf/renderer** (server-side) | PO PDFs rendered in Worker and sent via Resend |

**API structure:**

```
apps/api/src/
├── index.ts               # Hono app entry, middleware chain
├── middleware/
│   ├── auth.ts            # JWT decode, tenant context injection
│   ├── rls.ts             # Set Postgres session claims for RLS
│   └── rate-limit.ts
├── routes/
│   ├── auth/              # Sign-up, invite, onboarding
│   ├── catalog/           # Items, menu items, BOM CRUD
│   ├── procurement/       # Vendors, vendor products, POs
│   ├── inventory/         # Transactions, stock levels, counts
│   ├── warehousing/       # Storage areas, receiving, picking
│   ├── transfers/         # Inter-location transfers
│   ├── sales/             # POS/channel ingestion, channel map
│   ├── costing/           # Plate cost, cost snapshots
│   ├── ai/                # Insight alerts, forecast reads, LLM proxy
│   └── billing/           # Stripe webhook, plan entitlements
├── services/
│   ├── bom.ts             # Wraps packages/bom; depletion posting
│   ├── cost.ts            # Plate-cost recalculation
│   └── wac.ts             # Weighted-average cost updates on receipt
└── lib/
    ├── db.ts              # Drizzle client (Supabase connection pooler)
    ├── supabase.ts        # Supabase admin client (service role)
    └── stripe.ts
```

### 3.4 Web Frontend

| Concern | Technology |
|---|---|
| Framework | **React 19 + TypeScript** |
| Build tool | **Vite 6** |
| Routing | **TanStack Router** — file-based, fully typesafe |
| Server state | **TanStack Query (React Query v5)** — fetching, caching, realtime invalidation |
| Client state | **Zustand** — minimal global state (auth context, sidebar, active location) |
| UI primitives | **Radix UI** + **shadcn/ui** (component layer) |
| Styling | **Tailwind CSS v4** |
| Forms | **React Hook Form** + **Zod** |
| Data tables | **TanStack Table** |
| Charts | **Recharts** |
| Realtime | Supabase JS client `on('postgres_changes')` subscriptions |
| Auth | Supabase Auth JS (`@supabase/ssr`) |

### 3.5 Mobile

| Concern | Technology | Notes |
|---|---|---|
| Framework | **React Native + Expo SDK 53** | Shared TypeScript domain types with web/API |
| Navigation | **Expo Router v5** (file-based) | |
| UI components | **Tamagui** | Cross-platform design tokens; fast on Hermes |
| Forms | React Hook Form + Zod | Same schemas as web |
| Barcode scanning | **expo-camera** + **expo-barcode-scanner** | Receiving and picking flows |
| Camera (invoices) | **expo-image-picker** | Invoice capture → upload to object storage |
| Offline storage | **WatermelonDB** | SQLite-backed; syncs to Postgres on reconnect |
| Sync queue | **MMKV** (transaction write queue) | Count lines and receiving receipts queued locally when offline |
| Push notifications | **Expo Push Notifications** | Low-stock, price-spike, delivery alerts |
| OTA updates | **Expo Updates (EAS Update)** | Ship bug fixes without App Store review |

**Offline strategy:**
- `stock_count_line` and `goods_receipt` records are written to WatermelonDB first.
- A sync worker (background task) attempts flush to the API when connectivity returns.
- Conflict resolution: last-write-wins on count lines (timestamp-based); receiving receipts are idempotent (keyed on PO + item).
- The mobile app shows a sync-status indicator in the header at all times (per the UI principle "Offline honesty").

### 3.6 Auth

| Concern | Technology |
|---|---|
| Provider | **Supabase Auth** |
| Methods | Email/password, Google OAuth, Apple OAuth |
| JWT | Short-lived access tokens (1 hour); refresh rotation; custom claims: `tenant_id`, `role`, `location_ids` |
| MFA | TOTP enforced for `owner` and `manager` roles via Supabase Auth MFA |
| Session storage | HTTP-only cookies (web, via `@supabase/ssr`); SecureStore (mobile, via `expo-secure-store`) |

Custom JWT claims are injected via a Supabase Auth Hook (database function) that reads `user_location_role` at sign-in time.

### 3.7 Billing

| Concern | Technology |
|---|---|
| Billing engine | **Stripe Subscriptions** |
| Integration | Stripe Customer + Subscription per tenant, created at onboarding |
| Webhooks | `customer.subscription.updated/deleted` webhook → update `tenant.plan` + entitlement cache |
| Entitlement cache | Tenant record (`plan`, `max_locations`, `max_users`) refreshed on Stripe webhook |
| Enforcement | API checks entitlements at location/user creation; hard-blocks with upgrade prompt |

### 3.8 Email & Notifications

| Concern | Technology |
|---|---|
| Transactional email | **Resend** (`send.bytestreams.ai`) — PO PDFs, invites, alerts |
| Push notifications | **Expo Push Notifications** service |
| SMS (optional) | **Twilio** — critical shortage/delivery alerts for operators without the app open |
| In-app alerts | `insight_alert` table polled via Supabase Realtime |

### 3.9 ML / AI Service

| Concern | Technology | Notes |
|---|---|---|
| Framework | **FastAPI** (Python 3.12) | Async endpoints; OpenAPI docs auto-generated |
| Forecasting | **Prophet** + **LightGBM** | Prophet for trend/seasonality decomposition; LightGBM for feature-rich per-tenant models |
| Time-series utilities | **statsmodels** | ARIMA baselines, anomaly detection (price/shortage) |
| Data manipulation | **Pandas + NumPy** | |
| Model serialization | **joblib** | Models stored in Cloudflare R2 per tenant+version |
| Task queue | **Celery + Redis** (or Cloudflare Queue trigger → Worker → ML endpoint) | Scheduled retraining; prediction batch runs |
| Hosting | **Cloudflare Containers** (preferred) or **Fly.io** | Container-based; not edge-constrained like Workers |
| External data | Pluggable `DataSourceAdapter` interface — commodity indices, weather APIs | Fail-safe: degrade to tenant's own `price_history` |

**LLM layer:**

| Concern | Technology | Notes |
|---|---|---|
| Model | **Claude Sonnet** (standard), **Claude Opus** (complex reasoning) | Via Anthropic API |
| Prompt caching | Anthropic prompt caching API | Cache tenant catalog/BOM context across requests; reduces cost and latency |
| Use cases | Insight Q&A, PO drafting, invoice/order-guide extraction | |
| Document parsing | **Claude vision** | PDF/photo invoices → structured line items |
| Guardrails | All LLM outputs are proposals; no autonomous writes in v1 | Human confirmation required before any mutation |
| LLM proxy | `apps/api/src/routes/ai/` | API validates and rate-limits Claude calls; mobile/web never call Anthropic directly |

**ML service API surface (internal, not tenant-facing):**

```
POST /forecasts/run        # Trigger retraining + inference for a tenant+location
GET  /forecasts/{id}       # Read prediction output (also written to Postgres forecasts table)
POST /price-trends/analyze # Run price trajectory model for an item
POST /anomalies/detect     # Shortage / supply disruption detection
POST /llm/insights         # Natural-language insight generation (proxies Claude)
POST /llm/extract-invoice  # Document extraction (Claude vision)
```

### 3.10 Jobs & Scheduling

| Job | Schedule | Implementation |
|---|---|---|
| ABC classification | Daily | Cloudflare Cron → `apps/jobs` Worker |
| Reorder-point sweep | Every 4 hours | Cloudflare Cron → `apps/jobs` Worker |
| Forecast retraining | Weekly per tenant | Cron → Cloudflare Queue → ML service |
| Channel pull fallback | Every 15 min (Phase 3 contingency) | Cloudflare Cron → `apps/jobs` Worker |
| Price-trend model run | Daily | Cron → ML service |
| Cost snapshot | Daily | Cloudflare Cron → `apps/jobs` Worker |

### 3.11 Observability

| Concern | Technology |
|---|---|
| Error tracking | **Sentry** — API, web, mobile, ML service |
| Logging / traces | **Cloudflare Workers Logs & Traces** (API, jobs) |
| ML service logging | **structlog** → stdout → Fly/Container log drain |
| Uptime monitoring | Cloudflare Health Checks on API and ML service |
| Metrics | Sentry Performance for p50/p95 latency; custom Cloudflare Analytics |

---

## 4. Technical Architecture

### 4.1 Multi-Tenancy & RLS

Every tenant-scoped table implements the following RLS pattern:

```sql
-- Enable RLS
ALTER TABLE purchase_order ENABLE ROW LEVEL SECURITY;

-- All-access policy: tenant claim in JWT must match row's tenant_id
CREATE POLICY tenant_isolation ON purchase_order
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Location-scoped tables also check location_ids claim
CREATE POLICY location_scope ON inventory_transaction
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND location_id = ANY(
      ARRAY(SELECT jsonb_array_elements_text(auth.jwt() -> 'location_ids'))::uuid[]
    )
  );
```

The API middleware (`rls.ts`) sets the JWT as the Postgres session variable before executing any query:

```ts
// Drizzle + Supabase connection setup
await db.execute(sql`SELECT set_config('request.jwt', ${jwt}, true)`);
```

This means even if there is an application bug that omits a `tenant_id` filter, Postgres RLS will block the query — the database is the final enforcement layer.

### 4.2 BOM Engine (`packages/bom`)

The BOM explosion is a standalone pure-TypeScript package shared between the API (depletion) and the web (live plate-cost preview) and the ML service (ingredient-level forecasting).

```ts
// packages/bom/src/explode.ts
export type ComponentEdge = {
  itemId: string;
  isSubRecipe: boolean;
  qty: number;           // qty of this component per 1 unit of parent
  wastePct: number;      // e.g. 0.05 for 5%
  yieldQty: number;      // output qty when this sub-recipe is produced
  bom?: ComponentEdge[]; // child edges if sub-recipe
};

export function explode(
  bom: ComponentEdge[],
  qtySold: number,
): Map<string, number> {   // raw itemId → total qty needed
  const result = new Map<string, number>();
  const stack: Array<[ComponentEdge, number]> = bom.map(c => [c, qtySold]);

  while (stack.length > 0) {
    const [edge, multiplier] = stack.pop()!;
    const effectiveQty = edge.qty * multiplier * (1 + edge.wastePct);

    if (edge.isSubRecipe && edge.bom) {
      for (const child of edge.bom) {
        stack.push([child, effectiveQty / edge.yieldQty]);
      }
    } else {
      result.set(edge.itemId, (result.get(edge.itemId) ?? 0) + effectiveQty);
    }
  }

  return result;
}
```

**Caching:** exploded BOMs are cached in Cloudflare KV, keyed by `recipe_version_id`. Cache is invalidated when a new BOM version is created.

**Circular reference detection:** a depth-first pre-check traverses the DAG before saving any recipe component. If the same `itemId` appears in its own ancestry, the save is rejected with a 422.

### 4.3 Event-Sourced Inventory Ledger

Stock levels are never mutated directly. Every stock movement appends a row to `inventory_transaction`. Current on-hand is maintained as a projection.

**Write path:**

```
API receives depletion request
  → validate + authorize (RLS)
  → INSERT INTO inventory_transaction (type='sale_depletion', qty_delta=-N, ...)
  → UPDATE stock_level SET on_hand_qty = on_hand_qty + qty_delta  ← maintained projection
  → Publish Supabase Realtime event on stock_level row
```

`stock_level` is kept as a real table (not a view) for performance — it is the fast-read projection. On-hand can always be recomputed from the full ledger for audit/reconciliation.

**Weighted-average cost (WAC) update on receipt:**

```
new_avg_cost = (current_on_hand * current_avg_cost + received_qty * receipt_unit_cost)
               / (current_on_hand + received_qty)
```

WAC is recalculated in the same transaction as the receipt ledger entry. This keeps cost consistent with inventory balance at all times.

**Transaction reference fields** (`ref_type`, `ref_id`) link every ledger row back to its source:

| `txn_type` | `ref_type` | `ref_id` |
|---|---|---|
| `receipt` | `goods_receipt` | goods_receipt.id |
| `sale_depletion` | `sales_order` | sales_order.id |
| `waste` | `waste_log` | waste_log.id |
| `transfer_out/in` | `transfer` | transfer.id |
| `count_correction` | `stock_count` | stock_count.id |
| `production` | `production_run` | production_run.id |

### 4.4 POS Integration & Sales-Driven Depletion

**Ingestion endpoint:** `POST /api/channels/:source_system/orders`

The canonical write path is channel-agnostic. In v1, connector implementation order is
`dialtone` first, then `toast`, then `square`.

Security: HMAC-SHA256 signature on the request body, verified with a per-channel secret stored
in Cloudflare Worker secrets (never in git or env files).

```
Webhook arrives
  → Verify HMAC signature (reject 401 if invalid)
  → Upsert sales_order keyed on (source_system, source_order_id)
     → If already exists: 200 OK, no-op (idempotency)
     → If new: insert sales_order + sales_order_line rows
  → For each order line:
     → Resolve channel_item_map(tenant, source_system, external_item_id) → menu_item_id
     → If no mapping: insert into unmapped_item_queue; raise insight_alert
     → If mapped: BOM-explode(menu_item, qty) → raw item depletions
  → Batch INSERT inventory_transaction rows (sale_depletion)
  → UPDATE stock_level projection (batch)
  → Evaluate low-stock thresholds and prepare reorder suggestions
  → Mark sales_order.status = 'depleted'
  → Return 200 OK
```

This keeps the sale → depletion → reorder loop stable while allowing additional connectors
after the first deep POS integration is production-ready.

### 4.5 Real-Time Stock Updates

Clients subscribe to `stock_level` changes via Supabase Realtime:

```ts
// Web client
supabase
  .channel('stock-location-123')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'stock_level',
    filter: `location_id=eq.${locationId}`,
  }, payload => {
    queryClient.setQueryData(['stock', locationId, payload.new.item_id], payload.new);
  })
  .subscribe();
```

RLS on `stock_level` ensures a subscriber only receives rows their JWT authorizes.

### 4.6 ML Service Integration

The ML service communicates with the core Postgres database using a **read-only service account** (no RLS bypass, but all-tenants read for the ML schema) and writes predictions back to the `forecast` and `insight_alert` tables via the internal API (not direct DB writes from Python) — keeping write authorization centralized.

**Data flow:**

```
Cloudflare Cron trigger
  → Cloudflare Queue message: { job: 'forecast', tenant_id, location_id }
  → ML service worker consumes message
  → Fetches sales_order history from Postgres (read-only role)
  → Trains/updates per-tenant model
  → Writes forecast rows via POST /internal/forecasts (API validates + inserts)
  → API raises insight_alert if suggested par levels differ significantly
```

**Cold-start handling:** tenants with < 30 days of sales history receive category-level priors (computed from aggregate anonymized data across tenants). Confidence scores reflect data availability.

### 4.7 LLM / Claude Integration

The API acts as the LLM proxy — web/mobile never call Anthropic directly. This centralizes rate limiting, cost accounting, and prompt management.

**Invoice extraction flow:**

```
Mobile uploads photo → Supabase Storage (presigned URL)
  → POST /api/ai/extract-invoice { storage_path }
  → API fetches image from storage
  → Constructs Claude vision prompt with tenant's item catalog (prompt-cached)
  → Claude returns structured JSON: [{ item_name, qty, unit, unit_price }]
  → API returns line items for human review
  → On confirmation: POST /api/procurement/price-history (bulk insert)
```

**Prompt caching strategy:** The tenant's full item catalog and vendor product list are embedded as the system prompt prefix. Anthropic's prompt caching is applied to this prefix — it changes infrequently (only when catalog changes), so most Claude calls hit the cache and incur only the token read cost.

### 4.8 Plate Cost Recalculation

Plate cost must stay current whenever a component item's `avg_cost` changes (on every goods receipt). This is handled by a Postgres function triggered on `stock_level.avg_cost` update:

```sql
-- Triggered after UPDATE on stock_level when avg_cost changes
-- For every recipe_component that references this item
--   → invalidate BOM cache (via pg_notify → Cloudflare Queue consumer)
--   → schedule cost_snapshot recalculation
```

The Cloudflare Queue consumer picks up the invalidation event and re-runs plate cost for affected menu items, writing a new `cost_snapshot` row.

---

## 5. Security Implementation

### 5.1 Secrets Management

All secrets stored as **Cloudflare Worker Secrets** (API) and **Fly.io / Container secrets** (ML service). Never in `.env` files committed to git. Mirror established ByteStreams secret-handling practice.

Required secrets per service:

**API Worker:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `ANTHROPIC_API_KEY`
- `PRIMARY_CHANNEL_WEBHOOK_SECRET` (HMAC shared secret for selected POS connector)
- `DIALTONE_WEBHOOK_SECRET` (optional, when DialTone adapter is enabled)
- `INTERNAL_ML_API_KEY`

**ML Service:**
- `DATABASE_URL` (read-only connection string)
- `INTERNAL_API_KEY`
- `ANTHROPIC_API_KEY`
- External commodity feed API keys

### 5.2 Webhook Security

Channel webhook verification:

```ts
async function verifyHmac(request: Request, secret: string): Promise<boolean> {
  const signature = request.headers.get('x-supplyflow-signature');
  const body = await request.clone().arrayBuffer();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = await crypto.subtle.sign('HMAC', key, body);
  const expectedHex = Array.from(new Uint8Array(expected))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return signature === `sha256=${expectedHex}`;
}
```

The same verifier pattern is used for the first selected POS connector and any enabled
adapter channels (including DialTone). Stripe webhooks use Stripe's own `constructEvent`
signature verification.

### 5.3 Additional Controls

- **Input validation:** every API route validates input with Zod before touching the database.
- **SQL injection:** Drizzle ORM uses parameterized queries exclusively; no raw string interpolation.
- **CORS:** Workers set `Access-Control-Allow-Origin` to the specific web origin; no wildcard in production.
- **Rate limiting:** sliding-window rate limiter on auth endpoints (`/auth/*`) and ingestion endpoint using Cloudflare KV.
- **Audit log:** immutable rows written on PO approval, price override, inventory adjustment, role change. No `UPDATE`/`DELETE` granted on `audit_log`.
- **Least-privilege DB roles:** API uses anon/authenticated Supabase roles (RLS-bound); ML service uses a dedicated read-only role; service role key is used only for admin operations (user creation, migration).

---

## 6. CI/CD & Deployment

### 6.1 GitHub Actions Pipelines

| Pipeline | Trigger | Steps |
|---|---|---|
| `ci` | PR, push to `main` | Type-check, lint (ESLint/Biome), unit tests (Vitest), DB migration dry-run |
| `deploy-api` | Push to `main` | Build + `wrangler deploy` API Worker |
| `deploy-web` | Push to `main` | Vite build + Cloudflare Pages deploy |
| `deploy-jobs` | Push to `main` | Build + `wrangler deploy` jobs Worker |
| `deploy-ml` | Push to `main` (ml/ changes) | Docker build + push to registry + Fly/Container deploy |
| `deploy-mobile` | Tag `mobile/v*` | `eas build` → EAS Update (OTA) |
| `db-migrate` | Push to `main` (supabase/migrations/ changes) | `supabase db push` against staging; manual gate for production |

### 6.2 Environments

| Environment | Purpose | Database |
|---|---|---|
| `local` | Developer machines | `supabase start` (local Docker) |
| `staging` | Pre-production, CI deploys | Dedicated Supabase project |
| `production` | Live tenants | Separate Supabase project |

Database migrations are applied with the Supabase CLI. Migration files live in `supabase/migrations/` and are version-controlled. Migrations are tested in staging before production.

### 6.3 Deployment Targets

| Service | Platform |
|---|---|
| Core API Worker | Cloudflare Workers |
| Jobs Worker | Cloudflare Workers (Cron) |
| Web frontend | Cloudflare Pages |
| ML service | Cloudflare Containers (preferred) or Fly.io |
| Database | Supabase (managed Postgres) |
| Object storage | Supabase Storage + Cloudflare R2 |
| Queues | Cloudflare Queues |

---

## 7. Local Development Setup

```bash
# 1. Install tooling
pnpm install           # all workspace packages
supabase start         # starts local Postgres + Realtime + Auth + Storage

# 2. Apply migrations + seed
supabase db push       # runs supabase/migrations/
supabase db seed       # runs supabase/seed.sql (dev tenant, test users, sample catalog)

# 3. Start services
pnpm dev               # Turborepo: starts api, web, jobs in parallel

# 4. ML service (optional, Python)
cd apps/ml && uv sync && uv run uvicorn main:app --reload
```

**Key local env variables** (`.env.local`, git-ignored):
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` → from `supabase status`
- `SUPABASE_SERVICE_ROLE_KEY` → from `supabase status`
- `STRIPE_SECRET_KEY` → Stripe test mode key
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY` → Resend test mode
- `PRIMARY_CHANNEL_WEBHOOK_SECRET` → local test secret for selected POS connector
- `DIALTONE_WEBHOOK_SECRET` → local test secret when DialTone adapter is enabled

---

## 8. Key Technical Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo tool | Turborepo + pnpm | Incremental builds; strict dependency management |
| ORM | Drizzle | Edge-compatible; typesafe; schema as source of truth |
| API framework | Hono | Fastest edge-native TS framework; consistent with DialTone |
| Frontend router | TanStack Router | Fully typesafe routes; better than React Router for complex query-param handling |
| Mobile offline | WatermelonDB | SQLite-backed reactive DB; proven for offline-first mobile |
| Inventory pattern | Event-sourced ledger | Auditability; point-in-time reconstruction; WAC calculation integrity |
| BOM graph | DAG via `recipe_component` edges | Supports arbitrary nesting; circular detection on write |
| LLM proxy | API-mediated (never client-direct) | Centralizes cost tracking, rate limiting, and prompt management |
| ML ↔ API writes | ML reads Postgres directly; writes via API | Keeps write authorization centralized and auditable |
| Separate Supabase project | SupplyFlow owns its own DB | Schema independence; no DialTone coupling; future-proof for generic POS channels |

---

*End of Tech Stack & Technical Approach — SupplyFlow v0.1 (Draft).*
