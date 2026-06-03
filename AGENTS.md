# SupplyFlow — AI Agent Instructions

Multi-tenant restaurant supply-chain SaaS. Read this file before making any changes.

---
## Current Product Scope (June 2026)

- **Primary ICP:** independent single and multi-location operators and regional chains (**3–30 locations**).
- **Execution wedge:** **sale → depletion → reorder** loop with strong BOM accuracy.
- **Integration strategy:** execute connector implementation in this order: **DialTone first, then Toast, then Square**; keep ingestion channel-agnostic to avoid connector-specific coupling in core depletion/reorder paths.
- **Operational differentiator:** offline-first mobile counting/receiving is a headline requirement, not a later polish item.
- **AI posture:** explainable recommendations only; no autonomous ordering/inventory mutation in v1.

---

## Project Structure

```
supplyflow/
├── apps/
│   ├── api/        # Hono on Cloudflare Workers — primary backend API
│   ├── web/        # React 19 + Vite 6 + TanStack Router — web dashboard
│   ├── mobile/     # Expo SDK 53 + Expo Router v5 — iOS/Android app
│   ├── ml/         # Python 3.12 + FastAPI — forecasting & LLM service (not yet scaffolded)
│   └── jobs/       # Cloudflare Workers cron handlers (not yet scaffolded)
├── packages/
│   ├── bom/        # BOM explosion engine — pure TS, shared by api + web
│   ├── types/      # Shared domain types + Zod schemas for all PRD entities
│   ├── db/         # Drizzle ORM schema, Supabase client factory, RLS helpers
│   └── ui/         # Shared design system — Radix UI + Tailwind v4 components
├── supabase/       # config.toml, migrations, RLS policies, seed (not yet scaffolded)
├── docs/           # PRD, tech-stack, process-flow reference docs
└── developer/      # developer-journal.md — update after every session
```

---

## Common Commands

```bash
# Install all workspace deps
pnpm install

# Run everything in dev mode (Turborepo parallel)
pnpm dev

# Typecheck all packages
pnpm typecheck

# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @supplyflow/bom test

# Build all packages
pnpm build

# API dev server (Cloudflare Workers local, port 8787)
pnpm --filter @supplyflow/api dev

# Web dev server (Vite, port 5173 — proxies /v1 to localhost:8787)
pnpm --filter @supplyflow/web dev
```

---

## Stack & Key Patterns

### TypeScript / General
- TypeScript 5.x, strict mode, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`.
- All shared types live in `packages/types` as Zod schemas; infer TS types with `z.infer<>`.
- Package imports: `@supplyflow/bom`, `@supplyflow/types`, `@supplyflow/db`, `@supplyflow/ui`.

### API (`apps/api`)
- **Framework:** Hono on Cloudflare Workers. Runtime env type: `AppEnv = { Bindings: Env }`.
- **Env bindings** are declared in `src/lib/env.ts`. Never read `process.env` — use `c.env`.
- **Sales ingestion** is channel-aware (`source_system`) and must stay connector-agnostic in core pipeline code.
- **Auth middleware** (`src/middleware/auth.ts`) uses Web Crypto API (HMAC-SHA256) — no JWT library, no `nodejs_compat` needed for auth.
- **Rate-limit middleware** (`src/middleware/rate-limit.ts`) uses Cloudflare KV sliding-window (300 req/min).
- **RLS middleware** (`src/middleware/rls.ts`) attaches the raw JWT to context as `'rlsToken'`; call `setRlsToken(db, c.get('rlsToken'))` before any tenant-scoped query.
- **DB client** (`src/lib/db.ts`): `createWorkerDb(env)` — creates a per-request Drizzle instance backed by pg Pool (max=1) connecting to the Supabase Transaction pooler URL (port 6543). Never module-level singleton.
- Route handlers return 501 until implemented; implement one domain at a time starting from `src/routes/`.

### Database (`packages/db`)
- **ORM:** Drizzle with `pg` (node-postgres), NOT `@supabase/supabase-js`, for all SQL queries.
- `supabase-js` is used ONLY for Auth and Storage operations (`apps/api/src/lib/supabase.ts`).
- **RLS:** Always call `setRlsToken(db, jwt)` or use `withRls(db, jwt, fn)` before tenant queries. The `set_config('request.jwt', jwt, true)` `true` flag scopes the claim to the current transaction — required for Supabase Transaction pooler mode.
- Schema sub-path: `import * as schema from '@supplyflow/db/schema'`.
- Every tenant-scoped table has `tenant_id UUID NOT NULL` — RLS policies enforce isolation at the DB layer; the API must never be the sole enforcement.

### BOM Engine (`packages/bom`)
- `explode(bom, qtySold)` → `Map<itemId, totalQty>` — iterative (stack-based), handles nested sub-recipes, yield divisors, waste%.
- `assertAcyclic(rootEdges, recipeName)` — call before persisting any new `recipe_version`.
- Exploded BOMs are cached in Cloudflare KV keyed by `recipe_version_id`; invalidate on new version.

### Web (`apps/web`)
- Current state: minimal catalog console in `src/App.tsx` using React Query directly.
- When route complexity grows, migrate to TanStack Router file-based routes under `src/routes/` and keep `queryClient` in router context.
- Tailwind CSS v4: `@import "tailwindcss"` in `src/index.css`; no `tailwind.config.js`.
- Vite proxies `/v1` → `localhost:8787` in dev.

### Mobile (`apps/mobile`)
- Expo SDK 53, expo-router v5 (not v4), babel-preset-expo ~13.2.5.
- Offline-first: write `stock_count_line` + `goods_receipt` to WatermelonDB first; sync worker flushes to API on reconnect.
### Sales Channel & Integration Rules
- Keep ingestion APIs and services **channel-agnostic** (`source_system`, `source_order_id`).
- Prioritize depth on the first POS connector before adding breadth.
- Do not hardcode DialTone-only assumptions in core ingestion/depletion paths.

### Shared UI (`packages/ui`)
- `cn(...classes)` from `@supplyflow/ui` for all className merges.
- Design tokens in `src/styles.css` as Tailwind v4 `@theme` oklch vars.
- Import: `import { Button, Card, ... } from '@supplyflow/ui'`.

---

## Multi-Tenancy Rules

1. Every domain table has `tenant_id UUID NOT NULL`.
2. RLS is enabled on every tenant-scoped table — the DB is the final enforcement layer.
3. JWT claims `tenant_id`, `role`, and `location_ids` drive RLS policies.
4. Never write a query that filters only by non-tenant keys (e.g. `WHERE id = $1`) without also filtering by `tenant_id` at the application layer (belt-and-suspenders; RLS is the belt).

---

## Workflow

- **Do not commit automatically** — stage changes and let the user review.
- **Do not push** unless the user explicitly asks in that moment.
- **Do not run `wrangler deploy`** unless explicitly asked.
- **After every session** update `developer/developer-journal.md` (most recent entry first).
- Always use SSH for git remotes: `git@github.com:ByteStreams-AI/supplyflow.git`.
- Keep work sequencing aligned to wedge execution: core catalog/inventory + sales ingestion/depletion + reorder signal + offline mobile slice.

---

## Reference Docs

| Doc | Purpose |
|-----|---------|
| `docs/market-validation.md` | Market positioning, segment focus, and strategic wedge |
| `docs/PRD-SupplyFlow.md` | Current product requirements, data model (§6), module specs |
| `docs/project-status.md` | Active 2-week execution window and current priorities |
| `docs/tech-stack-and-approach.md` | Architecture decisions, BOM engine spec (§4.2), RLS patterns (§4.1) |
| `docs/process-flow-pos-to-procurement.md` | Sales channel → depletion → AI → PO pipeline |
| `developer/developer-journal.md` | Chronological implementation log |
