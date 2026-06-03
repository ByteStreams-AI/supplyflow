# SupplyFlow — Developer Journal

Chronological record of implementation decisions, changes made, and why. Most recent entry first.

---

## June 3, 2026 — Addressed Milestone 1 code-review risks (6 items)

Implemented follow-up fixes for the six risks identified in the Milestone 1 review.

**What changed:**

- **Connector-order documentation consistency**
  - Updated `docs/market-validation.md` to match confirmed sequence: **DialTone → Toast → Square**.
  - Previously updated docs (`AGENTS.md`, `README.md`, `docs/PRD-SupplyFlow.md`, `docs/tech-stack-and-approach.md`) remain aligned.
- **Milestone status wording accuracy**
  - Updated `docs/project-status.md` to clarify connector contracts are documented in Milestone 1 while ingestion route implementation starts in Milestone 2.
- **Auth middleware hardening**
  - Updated `apps/api/src/middleware/auth.ts` with robust base64url decoding, payload parsing guards, and runtime claim-shape validation to return 401s for malformed tokens/claims instead of surfacing 500s.
- **Catalog API test realism improvements**
  - Reworked `apps/api/src/routes/catalog/index.test.ts` to run through `authMiddleware` + `rlsMiddleware` with real signed JWTs instead of manually injecting claims.
  - Added tenant isolation checks for update/delete operations (in addition to reads).
- **Targeted validation test coverage expansion**
  - Added catalog-route tests for missing auth (401), malformed JSON (400), invalid UUID params (400), and empty update payloads (400).
  - Added dedicated auth tests in `apps/api/src/middleware/auth.test.ts` for valid JWT, malformed base64url payload, and missing required claims.
- **Web architecture instruction drift reduction**
  - Updated `AGENTS.md` Web section to match current implementation (`src/App.tsx` + React Query), with explicit migration guidance to TanStack Router when route complexity grows.

**Validation performed:**

- `pnpm --filter @supplyflow/api test` ✅
- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `pnpm test` ✅

**Why this was done:**

- The review identified accuracy and reliability gaps spanning docs consistency, auth robustness, and test confidence on tenant/auth boundaries.
- These changes reduce execution ambiguity and improve failure behavior and regression detection in the API slice.

## June 3, 2026 — Connector implementation order fixed to DialTone → Toast → Square

Aligned active planning/implementation docs to the confirmed connector rollout order: **DialTone first, then Toast, then Square**.

**What changed:**

- Updated product/instruction docs to remove Toast/Square-first ambiguity:
  - `AGENTS.md`
  - `README.md`
  - `docs/tech-stack-and-approach.md`
  - `docs/PRD-SupplyFlow.md`
- Updated PRD language in:
  - v1 non-goals and target audience wording
  - Module G strategy and technical considerations
  - risk/mitigation table for connector sequencing
  - future expansion section
  - confirmed decisions and open-question framing
- Updated PRD enum examples to list channel order as `dialtone|toast|square|...` for consistency in documentation examples.

**Why this was done:**

- The repository had conflicting guidance between `docs/project-status.md` (DialTone-first) and several other active docs still indicating Toast/Square-first.
- This alignment removes execution ambiguity for connector sequencing while preserving the channel-agnostic ingestion architecture.

## June 3, 2026 — Milestone 1 implemented (types/tooling, catalog API, catalog web flow)

Implemented Milestone 1 execution work from `docs/project-status.md`, covering the shared type/tooling blocker, catalog API endpoints, minimal catalog web flow, and targeted tests.

**What changed:**

- Resolved the shared type-export collision by renaming inventory storage-zone exports:
  - `StorageZoneSchema`/`StorageZone` in `packages/types/src/inventory.ts` became `StorageAreaZoneSchema`/`StorageAreaZone`.
- Hardened workspace type/lint baseline:
  - Added root flat ESLint configuration (`eslint.config.mjs`) and shared lint dependencies in root `package.json`.
  - Added minimal mobile TypeScript scaffold (`apps/mobile/tsconfig.json`, `apps/mobile/app/index.tsx`) so root `typecheck`/`lint` run cleanly.
  - Fixed API lint violations in placeholder service stubs (`apps/api/src/services/bom.ts`, `apps/api/src/services/cost.ts`).
- Implemented catalog API slice in `apps/api/src/routes/catalog/index.ts`:
  - Replaced `501` handlers for:
    - `GET/POST/GET by id/PUT/DELETE /v1/catalog/items`
    - `GET/POST/GET by id/PUT /v1/catalog/menu-items`
  - Added request-body and param validation via `@supplyflow/types` schemas and `UuidSchema`.
  - Applied tenant-safe access pattern:
    - per-request DB via `createWorkerDb(c.env)`
    - `setRlsToken(db, c.get('rlsToken'))`
    - tenant scoping in queries (`tenant_id` + id filters).
  - Added numeric conversions between API shapes (`number`) and DB numeric columns (`string`) for inserts/updates/responses.
- Implemented minimal catalog web flow:
  - Added `apps/web/src/App.tsx` with list/create/edit flows for items and menu items.
  - Added API client helper `apps/web/src/lib/catalog-api.ts`.
  - Updated `apps/web/src/main.tsx` to render the new app.
  - Removed unused file-router artifacts and plugin wiring:
    - deleted generated route files and `routeTree.gen.ts`
    - removed TanStack Router Vite plugin from `apps/web/vite.config.ts`.
- Added targeted catalog API tests:
  - `apps/api/src/routes/catalog/index.test.ts` includes:
    - item CRUD happy path
    - tenant-isolation read checks
    - menu-item create/list/update path
  - Added API `test` script and vitest dependency in `apps/api/package.json`.
- Updated milestone status tracking:
  - marked Milestone 1 tasks and Milestone 1 exit criteria as complete in `docs/project-status.md`.

**Validation performed:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `pnpm test` ✅
- `pnpm --filter @supplyflow/web build` ✅

**Why this was done:**

- Milestone 1 required moving from scaffold to a usable vertical slice: green baseline checks, real catalog APIs, and a working local web flow tied to those APIs.
- The added tests and workspace validation establish a stable base for Milestone 2 work.

---

## June 3, 2026 — Project-status converted to milestone checkbox tracking

Updated `docs/project-status.md` to make progress state directly trackable in the document by replacing week-based sections with milestone-based checklist sections.

**What changed:**

- Renamed execution framing from **2-Week Execution Plan** to **2-Milestone Execution Plan**.
- Renamed section labels from **Week 1 / Week 2** to **Milestone 1 / Milestone 2**.
- Converted milestone task lists into markdown checkbox items (`- [ ] ...`), preserving nested implementation details.
- Renamed **Week 1 exit criteria** and **Week 2 exit criteria** to milestone labels and converted each criterion to checkbox format.
- Added explicit milestone-level completion checkboxes for Milestone 1 and Milestone 2.

**Why this was done:**

- The previous format provided guidance but did not make status easy to track at a glance.
- Checkbox milestones/tasks now support direct progress updates without changing document structure.

---

## June 3, 2026 — Project-status connector order corrected (DialTone first)

Updated `docs/project-status.md` to reflect the requested connector-order change in the 2-week plan: `dialtone.menu` is now the first ingestion path, with Toast and Square explicitly second and third.

**What changed:**

- Updated market-alignment constraint #3 to prioritize `dialtone.menu` first.
- Updated primary outcome #3 to state DialTone-first sequencing.
- Updated Week 1 decision step and Week 1 exit criterion:
  - connector order documented as 1) `dialtone.menu`, 2) Toast, 3) Square.
- Updated Week 2 ingestion step from generic POS baseline to `dialtone.menu` baseline.
- Updated Week 2 exit criteria and Definition of Done to enforce the same order.
- Updated guardrail/deferred wording to reflect delayed Toast/Square expansion until the DialTone-first loop is stable.

**Why this was done:**

- Requested scope correction: connector priority needed to start with `dialtone.menu`, not Toast/Square.
- Keeping sequencing explicit in project-status prevents execution drift during implementation.

---

## June 3, 2026 — README updated to current scope and execution plan

Updated `README.md` to align with the latest market-validated positioning and current execution scope reflected in `docs/market-validation.md`, `docs/PRD-SupplyFlow.md`, and `docs/project-status.md`.

**What changed:**

- Updated product summary to the current ICP: independent multi-location/regional operators (**3–30 locations**).
- Added explicit wedge and strategy statements:
  - **sale → depletion → reorder** as execution wedge
  - one deep POS integration first (**Toast** or **Square**)
  - channel-agnostic ingestion, with DialTone as compatible adapter where enabled
- Updated core capability language from DialTone-specific depletion to channel-agnostic POS ingestion.
- Updated environment variable examples:
  - added `PRIMARY_CHANNEL_WEBHOOK_SECRET`
  - kept `DIALTONE_WEBHOOK_SECRET` as optional adapter secret
- Updated documentation links:
  - replaced old PRD filename reference with `docs/PRD-SupplyFlow.md`
  - added `docs/market-validation.md`
  - added `docs/project-status.md`
- Updated development phase naming from **DialTone Integration & Costs** to **POS Integration & Costs**.
- Updated related-project wording so DialTone is described as a compatible adapter channel rather than the sole v1 channel.

**Why this was done:**

- README was still carrying older DialTone-primary and outdated doc reference wording after scope shifted to a POS-first, market-validated wedge plan.
- Keeping the repository entrypoint doc current reduces onboarding confusion for contributors and agents.

---

## June 3, 2026 — Agent instruction files updated to latest plan/scope

Updated agent instruction docs to reflect the current market-aligned execution scope and documentation sources.

**What changed:**

- Revised `AGENTS.md` with a new **Current Product Scope (June 2026)** section:
  - primary ICP: 3–30 location operators
  - wedge: sale → depletion → reorder
  - integration strategy: one deep POS connector first (Toast or Square), channel-agnostic ingestion, DialTone as compatible adapter
  - offline-first mobile as a headline requirement
  - explainable AI and no autonomous ordering/inventory mutations in v1
- Added explicit sales-channel engineering rules in `AGENTS.md`:
  - keep ingestion APIs channel-agnostic (`source_system`, `source_order_id`)
  - avoid DialTone-only assumptions in core ingestion/depletion paths
- Updated workflow/reference sections in `AGENTS.md`:
  - wedge-aligned sequencing guidance
  - source docs now include `docs/market-validation.md`, `docs/PRD-SupplyFlow.md`, and `docs/project-status.md`
  - replaced outdated PRD path reference
- Confirmed `CLAUDE.md` is a symlink to `AGENTS.md` (`CLAUDE.md -> AGENTS.md`), so AGENTS updates apply to both files immediately.

**Why this was done:**

- The implementation plan and scope shifted to a market-validated, POS-first wedge strategy.
- Agent instructions needed to match current priorities to prevent execution drift.

---

## June 3, 2026 — Tech stack doc aligned to POS-first market terminology

Aligned `docs/tech-stack-and-approach.md` with the terminology and strategic framing already updated in `docs/market-validation.md`, `docs/PRD-SupplyFlow.md`, and `docs/project-status.md`.

**What changed:**

- Updated metadata reference from `docs/PRD-SupplyFlow-2026-05-21.md` to `docs/PRD-SupplyFlow.md`.
- Added explicit guiding principle for the validated wedge: **sale → depletion → reorder loop** for the **3–30 location** segment, with one deep POS connector first.
- Updated mobile stack versions to match the current project baseline:
  - Expo SDK 53
  - Expo Router v5
- Replaced DialTone-specific wording in architecture paths with channel-aware wording where needed:
  - sales route notes in API structure
  - scheduled job naming (`Channel pull fallback`)
  - Section 4.4 rewritten from DialTone-specific ingestion to channel-agnostic POS ingestion with a `:source_system` endpoint and depth-first connector strategy.
- Generalized webhook/secrets guidance:
  - added `PRIMARY_CHANNEL_WEBHOOK_SECRET`
  - retained optional `DIALTONE_WEBHOOK_SECRET` for adapter mode
  - updated webhook verification prose to apply to any enabled channel.
- Updated local environment variable examples to match the channel-aware secret model.

**Why this was done:**

- The previous tech stack document still reflected older DialTone-primary wording in key architecture sections.
- This pass keeps implementation docs aligned with the validated market strategy and avoids contradictory guidance during execution.

---

## June 3, 2026 — PRD terminology alignment with market-validation

Aligned `docs/PRD-SupplyFlow.md` terminology and priority framing with `docs/market-validation.md` so product language and execution intent now match across strategy and implementation docs.

**What changed:**

- Reframed the PRD ICP to the validated segment: **independent multi-location and regional operators (3–30 locations)**.
- Updated v1 integration wording from DialTone-only to **one deep POS integration first (Toast or Square)** with channel-agnostic ingestion and DialTone compatibility.
- Reworked Module G language from \"DialTone Integration\" to **\"POS Integration & Sales-Driven Depletion\"** and added explicit wedge-loop language (sale → depletion → reorder signal).
- Updated related PRD references to keep terms consistent:
  - inventory cross-reference wording
  - costing sales-mix source wording
  - forecasting input wording
  - sales/channel enum examples in conceptual data model
  - security webhook language
  - phase names and phase-exit wording
  - challenge table, future expansion text, and open questions
- Updated `docs/project-status.md` source-of-truth PRD reference to `docs/PRD-SupplyFlow.md`.

**Why this was done:**

- `market-validation.md` established a clear commercial wedge and segment focus; PRD language needed to reflect those constraints to avoid strategy/roadmap drift.

**Resulting alignment state:**

- Market doc, PRD, and project-status now consistently describe:
  - target segment (3–30 locations)
  - depth-first POS strategy (Toast/Square first)
  - channel-agnostic ingestion design
  - offline mobile and explainable AI positioning

---

## June 3, 2026 — Project status realigned to market-validation wedge

Updated planning/status documentation to align execution with `docs/market-validation.md` so delivery priorities match validated market pressure instead of a generic feature roadmap.

**What changed:**

- Reworked `docs/project-status.md` into a market-aligned 2-week wedge plan.
- Added explicit market constraints to the status doc:
  - target segment: 3–30 location operators
  - wedge: BOM accuracy + POS sale→depletion→reorder loop
  - one deep POS integration first (Toast or Square)
  - offline mobile counting as a headline capability
  - explainable recommendation outputs
  - early onboarding-friction reduction focus
- Updated 2-week outcomes/exit criteria to include POS-ingestion baseline and offline-count thin slice, in addition to CI/typecheck/lint/test stabilization.
- Updated risk section to reflect market-facing risks from validation (platform bundling pressure, onboarding friction, integration maintenance burden).

**Why this was done:**

- The prior status plan was technically coherent but did not explicitly enforce the commercial wedge validated in market research.
- This alignment keeps implementation choices tied to a defensible go-to-market path and avoids broad, low-differentiation scope.

**Next execution focus (unchanged in intent, now explicit in status):**

1. Fix workspace type/lint blockers.
2. Implement catalog + inventory foundations.
3. Choose and start one deep POS integration path.
4. Deliver offline-count thin slice and supporting platform scaffolds.

---

## May 26, 2026 — S1 continuation: all four shared packages

Second session on the same day. Picked up exactly where the scaffold left off and finished all four shared packages. First `pnpm install` run.

**What was built:**

- **`packages/bom`** — BOM explosion engine. Three files:
  - `src/explode.ts` — `ComponentEdge` type + iterative stack-based `explode()` function returning `Map<itemId, totalQty>`. Handles nested sub-recipes, yield divisors, and waste percentages. Iterative (not recursive) to avoid call-stack overflow on deep BOMs.
  - `src/check-circular.ts` — `findCycle()` (depth-first with ancestor tracking) and `assertAcyclic()` (throws if cycle found). Called before persisting any new recipe version.
  - `src/__tests__/bom.test.ts` — 9 vitest unit tests: flat BOM, waste%, nested sub-recipe with yield, item accumulation across components, empty BOM, qtySold=0, acyclic DAG, direct self-reference, indirect A→B→A cycle. **All 9 passing.**

- **`packages/types`** — shared TypeScript domain types + Zod schemas across five files mirroring every PRD entity:
  - `tenancy.ts` — `Tenant`, `Location`, `AppUser`, `UserLocationRole`, `AuditLog`, `JwtClaims` + all enums.
  - `catalog.ts` — `Item`, `MenuItem`, `RecipeVersion`, `RecipeComponent`, `Substitution` + request shapes (`CreateItem`, `UpsertRecipeVersion`, etc.).
  - `procurement.ts` — `Vendor`, `VendorProduct`, `PriceHistory`, `PurchaseOrder`, `PurchaseOrderLine` + request shapes.
  - `inventory.ts` — `StorageArea`, `StockLevel`, `InventoryTransaction`, `GoodsReceipt`, `StockCount`, `StockCountLine`, `Transfer` + request shapes.
  - `sales.ts` — `SalesOrder`, `SalesOrderLine`, `ChannelItemMap`, `CostSnapshot`, `AbcClassification`, `Forecast`, `InsightAlert`, `DialToneWebhook`.

- **`packages/db`** — Drizzle ORM schema + client factory + RLS helper:
  - `src/schema/tenancy.ts` — `tenant`, `location`, `appUser`, `userLocationRole`, `auditLog` tables + enums.
  - `src/schema/catalog.ts` — `item`, `menuItem`, `recipeVersion`, `recipeComponent`, `substitution` tables + enums.
  - `src/schema/procurement.ts` — `vendor`, `vendorProduct`, `priceHistory`, `purchaseOrder`, `purchaseOrderLine` tables + enums.
  - `src/schema/operations.ts` — `storageArea`, `stockLevel`, `inventoryTransaction`, `goodsReceipt`, `stockCount`, `stockCountLine`, `transfer`, `salesOrder`, `salesOrderLine`, `channelItemMap`, `costSnapshot`, `abcClassification`, `forecast`, `insightAlert` tables + enums.
  - `src/client.ts` — `createDb(connectionString)` factory wrapping a pg `Pool` (max=1 for Workers transaction-mode pooler).
  - `src/rls.ts` — `setRlsToken(db, jwt)` executes `SET request.jwt` via `set_config`. `withRls(db, jwt, fn)` wraps a callback in a transaction with the claim pre-set.
  - Added `"./schema"` sub-path export to `package.json` so `apps/api` can do `import * as schema from '@supplyflow/db/schema'`.

- **`packages/ui`** — shared design system:
  - `src/lib/utils.ts` — `cn()` via `clsx` + `tailwind-merge`.
  - `src/components/` — `button.tsx` (`cva` variants: default/destructive/outline/secondary/ghost/link; sizes: default/sm/lg/icon), `card.tsx` (Card/Header/Title/Description/Content/Footer), `input.tsx`, `label.tsx` (Radix), `separator.tsx` (Radix).
  - `src/styles.css` — Tailwind v4 `@theme` block with brand palette (oklch), ABC class badge colours, alert severity tokens, border-radius scale.

- **`apps/api` additions:**
  - `src/lib/db.ts` — `createWorkerDb(env)` factory that wires the Drizzle client to the Supabase Transaction pooler URL. Per-request instantiation (no module singleton — Workers can't hold TCP connections).
  - `src/lib/env.ts` — added `SUPABASE_DB_URL` binding (Transaction pooler, port 6543).
  - `wrangler.toml` — added secrets comment block documenting all required `wrangler secret put` keys for production.

- **`pnpm install`** — first successful run. 1174 packages installed. Lock file generated.

**Bugs caught and fixed:**

- `apps/mobile/package.json`: `expo-router: ~4.1.3` doesn't exist — Expo SDK 53 ships Router v5. Corrected to `~5.1.11`.
- `apps/mobile/package.json`: `babel-preset-expo: ~13.0.4` doesn't exist on npm. SDK 53 tag is `13.2.5`. Corrected.
- `packages/bom` test file had incorrect import paths (`'../src/explode.js'` from inside `src/__tests__/`) — fixed to `'../explode.js'`.

**Decisions made:**

- **`packages/db` client uses `pg` (node-postgres) not `@supabase/supabase-js`** for Drizzle — Drizzle's `node-postgres` adapter gives full control over the connection string and works with the Supabase pooler; the Supabase JS client is a separate concern (used in `apps/api/src/lib/supabase.ts` for Auth and Storage operations only).
- **`withRls` scopes `SET request.jwt` to the transaction via `set_config(..., true)`** — the `local` flag is critical for Supabase Transaction pooler mode; without it the claim can leak to a subsequent connection in the pool.
- **`packages/ui` styles use oklch** — Tailwind v4's preferred colour model; perceptually uniform, trivial to derive tints/shades without a preprocessor.
- **No vitest config file in `packages/bom`** — vitest auto-discovers `**/__tests__/**` by default; no config needed for a pure-TS package without browser globals.

**Still pending (updated priority order):**

1. `supabase/` — `config.toml`, migration files (0001_tenancy through 0010+), RLS policies, seed (dev tenant "The Anchor", 2 locations, test users per role, sample catalog)
2. `apps/jobs` — `wrangler.toml` with 5 cron triggers; handlers: `abc-classification.ts`, `reorder-sweep.ts`, `forecast-retrain.ts`, `cost-snapshot.ts`, `dialtone-pull-fallback.ts`
3. `apps/ml` — Python FastAPI service (`pyproject.toml`, `main.py`, routes)
4. `apps/mobile` source files — `app/` routes (tabs: dashboard, receive, count, transfer, alerts), WatermelonDB models, offline sync worker
5. `.github/workflows/` — `ci.yml` (typecheck + lint + test), `deploy-api.yml`, `deploy-web.yml`
6. Wire API route handlers (start with `/catalog` and `/inventory` once `supabase/` migrations exist)

**Next session:** `supabase/` setup — `config.toml`, then migrations in domain order (tenancy → catalog → procurement → inventory → warehousing → sales → costing → AI), RLS policies for each table group, seed file.

---

## May 26, 2026 — Initial monorepo scaffold

First real code commit. Laid down the full project skeleton from the tech-stack doc so future sessions can go straight to implementation rather than setup decisions.

**What was scaffolded:**

- **Root config** — `package.json` (pnpm workspaces + Turborepo), `pnpm-workspace.yaml`, `turbo.json` (build/dev/lint/typecheck/test task pipeline with correct `dependsOn` and caching), `tsconfig.base.json` (strict mode, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), `.gitignore`, `.prettierrc.json`.

- **`apps/api`** — Hono on Cloudflare Workers. Entry (`index.ts`) wires global middleware (logger, secureHeaders, CORS, rate-limit) then mounts all domain route groups under `/v1` behind auth + RLS middleware. Env type (`lib/env.ts`) declares all bindings and secrets. Three middleware files:
  - `auth.ts` — edge-native JWT verification using Web Crypto API (no Node dependencies); decodes and validates HMAC-SHA256 signature, checks expiry, injects `jwtClaims` into Hono context.
  - `rls.ts` — attaches raw JWT token to request context so `packages/db` can SET the Postgres session claim before each query.
  - `rate-limit.ts` — sliding-window 300 req/min limiter backed by Cloudflare KV; keys on `user:<id>` post-auth or `ip:<ip>` pre-auth.
  - Ten route stub files covering every domain area from the PRD (auth, catalog, procurement, inventory, warehousing, transfers, sales, costing, ai, billing). All stubs return 501 — wire-up happens sprint by sprint.
  - Three service files: `bom.ts` (depletion posting wrapper), `cost.ts` (plate-cost recalculation stub), `wac.ts` (weighted-average cost math — pure function, fully implemented).

- **`apps/web`** — React 19 + Vite 6 + TanStack Router. Vite config proxies `/v1` to the local Workers dev server on port 8787. TanStack Router file-based routing with `QueryClient` in router context. Tailwind CSS v4 via `@tailwindcss/vite` plugin. Supabase JS client in `src/lib/supabase.ts`. Root route and placeholder index route in place. `.env.example` documents the three required env vars.

- **`apps/mobile`** — `package.json` with Expo SDK 53, Expo Router v4, WatermelonDB (offline-first SQLite), MMKV (transaction write queue), Tamagui (cross-platform UI). `app.json` with iOS bundle ID `ai.bytestreams.supplyflow`, Android package, camera/barcode permissions, EAS Update config.

**Decisions made / options closed:**

- **`auth.ts` uses Web Crypto for JWT verification** (not a library) — keeps the Worker free of any `crypto` polyfill dependency and avoids `nodejs_compat` requirement for this middleware. The HMAC-SHA256 path is the only case needed for Supabase JWTs.
- **Rate-limiter keys on user ID post-auth, IP pre-auth** — protects unauthenticated endpoints (health, Stripe webhook) without requiring a signed-in user. The `/health` endpoint is exempted by running `rateLimitMiddleware` before `authMiddleware` in the chain order.
- **`wrangler.toml` CORS set to `origin: (origin) => origin`** — permissive in dev, intended to be tightened per-env in production via a `ALLOWED_ORIGINS` env var (not yet wired; todo before staging deploy).
- **Remote switched to SSH** (`git@github.com:ByteStreams-AI/supplyflow.git`) — HTTPS was the default from `git clone` but consistently fails with org-scoped repos on this machine.

**Still pending (in order of sprint priority):**

1. `apps/mobile` source files — `app/` routes, WatermelonDB schema, offline sync worker
2. `apps/ml` — Python FastAPI service (`pyproject.toml`, `main.py`, route handlers for forecasts, price-trends, anomalies, LLM proxy, invoice extraction)
3. `apps/jobs` — Cloudflare Workers cron (`wrangler.toml` with cron triggers, job handlers for ABC classification, reorder sweep, forecast retrain, cost snapshot, DialTone pull fallback)
4. `packages/types` — shared TypeScript domain types + Zod schemas for all PRD entities
5. `packages/db` — Drizzle schema, Supabase client factory, RLS session-claim helper
6. `packages/bom` — BOM explosion engine (`explode.ts` + circular-reference detection)
7. `packages/ui` — shared design system (shadcn/ui components on Radix + Tailwind)
8. `supabase/` — `config.toml`, migration files per domain module, RLS policies, seed (dev tenant + test users + sample catalog)
9. `.github/` — CI workflow (`ci.yml`: typecheck + lint + test on PR), deploy workflows (`deploy-api.yml`, `deploy-web.yml`)
10. `pnpm install` — run after all `package.json` files are in place

**Next session:** pick up at `packages/bom` (highest shared-value item) then `packages/types` and `packages/db`, which unblock the API route implementations.
