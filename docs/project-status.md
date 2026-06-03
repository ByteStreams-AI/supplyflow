# SupplyFlow — Project Status

**Project Start:** May 21, 2026  
**Last Update:** June 3, 2026  
**Current Stage:** PRD-aligned execution tracking with full feature coverage.

---

## Current Snapshot

- Monorepo structure is in place (`apps/*`, `packages/*`, Turbo + pnpm workspace).
- API middleware foundation is implemented (auth, RLS token propagation, rate limiting).
- Catalog item/menu-item CRUD is implemented in API + minimal web console flow.
- Most non-catalog business routes remain `501` placeholders.
- Product positioning and planning now explicitly support both single-location and multi-location operators.
- Mobile is scaffold-level (`apps/mobile/app/index.tsx` placeholder screen).
- `apps/ml`, `apps/jobs`, `supabase/`, and `.github/workflows/` are not scaffolded yet.

### Health signals (verified June 3, 2026)

- `pnpm typecheck`: **passing**
- `pnpm lint`: **passing**
- `pnpm test`: **passing**
  - `packages/bom`: 9 tests passing
  - `apps/api`: 11 tests passing (`catalog` routes + `auth` middleware)

---

## PRD Coverage Matrix (All Features)

Legend: `Done` = implemented and validated in repo, `In Progress` = partial implementation exists, `Not Started` = no working implementation yet.

### Module A — Multi-Tenant Foundation & Access Control (PRD §3.1)

- Tenant provisioning/onboarding wizard: **Not Started**
- Location management UI/API: **Not Started**
- User invitation + role assignment flows: **Not Started**
- Stripe billing skeleton and plan enforcement: **Not Started** (billing routes are placeholders)
- Audit log for sensitive actions: **Not Started**
- RLS-oriented backend foundations (JWT claims middleware + RLS token handoff): **In Progress**

### Module B — Catalog & BOM (PRD §3.2)

- Items CRUD: **Done** (`/v1/catalog/items`)
- Menu items CRUD (list/create/get/update): **Done** (`/v1/catalog/menu-items`)
- BOM explosion engine package (`packages/bom`): **Done** (implemented + tests)
- Circular BOM detection (`assertAcyclic` / cycle checks): **Done** (implemented + tests)
- API BOM endpoints (`/menu-items/:id/bom*`): **Not Started** (`501`)
- BOM editor UI, UoM workflows, recipe versioning UX: **Not Started**

### Module C — Procurement (PRD §3.3)

- Vendor management
- Vendor products + pricing
- Purchase orders + approval/send lifecycle
- Reorder suggestions
- Sole-source risk and JIT ordering workflows

Status for all Module C features: **Not Started** (procurement routes are placeholders)

### Module D — Inventory Management (PRD §3.4)

- Stock-level read/write API: **Not Started** (`501`)
- Inventory transaction ledger API: **Not Started** (`501`)
- Physical count flows (full/cycle): **Not Started** (`501`)
- Sales-driven depletion integration: **Not Started**
- ABC analysis: **Not Started**
- Waste/substitution/reorder alert workflows: **Not Started**
- Core schemas/types for inventory domain: **In Progress** (types + DB schema exist)

### Module E — Warehousing (PRD §3.5)

- Storage areas/zones API: **Not Started** (`501`)
- Goods receipt workflows: **Not Started** (`501`)
- Picking workflows: **Not Started** (`501`)
- Expiry/lot operational workflows: **Not Started**

### Module F — Logistics & Distribution (PRD §3.6)

- Transfer request/dispatch/receive flows: **Not Started** (`501`)
- Delivery calendar and tracking: **Not Started**
- Delivery exception handling: **Not Started**

### Module G — POS Integration & Sales-Driven Depletion (PRD §3.7)

- Connector order decision (`dialtone` → `toast` → `square`): **Done** (documented)
- Channel-agnostic ingestion contract design: **In Progress** (documented; no working ingestion route yet)
- DialTone webhook ingestion route implementation: **Not Started** (`501`)
- Channel item mapping endpoints: **Not Started** (`501`)
- Idempotent order persistence + depletion traceability: **Not Started**
- Unmapped-item exception workflow: **Not Started**

### Module H — Cost Controls (PRD §3.8)

- Plate cost API
- Food-cost % and snapshots
- Margin dashboard support
- Repricing guidance workflows

Status for all Module H features: **Not Started** (`costing` routes are placeholders)

### Module I — Predictive Intelligence / AI (PRD §3.9)

- Forecast APIs
- Insight/alert APIs
- Invoice extraction API
- Explainable recommendation surfaces
- ML service integration

Status for all Module I features: **Not Started** (`ai` routes are placeholders; `apps/ml` missing)

### Platform / Security / Infra (PRD §4, §8)

- Web app (back-office) foundational catalog console: **In Progress**
- Mobile app offline operational workflows: **Not Started** (scaffold only)
- Auth middleware with JWT verification: **Done**
- Rate limiting middleware: **Done**
- RLS token propagation middleware: **Done**
- Stripe webhook/plan APIs: **Not Started** (`501`)
- CI workflows (`.github/workflows`): **Not Started**
- Supabase project scaffold (`supabase/`): **Not Started**

---

## PRD-Aligned Milestones

## Milestone 1 — Foundation + Catalog Slice

**Status:** `Complete`

- [x] Workspace baseline commands green (`typecheck`, `lint`, `test`)
- [x] Shared packages scaffolded (`types`, `db`, `bom`, `ui`)
- [x] Catalog item/menu-item CRUD API implemented
- [x] Catalog web list/create/edit flow implemented
- [x] Catalog-focused API test coverage added
- [x] Connector implementation order documented (`dialtone` → `toast` → `square`)

## Milestone 2 — Module A Completion (Tenancy, Access, Billing)

**Status:** `Not Started`

- [ ] Tenant self-onboarding flows
- [ ] Location management
- [ ] User invite + role assignment + location scoping
- [ ] Billing plan retrieval/portal/webhook flows
- [ ] Audit-log write paths for sensitive actions

## Milestone 3 — Module B Completion (Full Catalog + BOM Workflows)

**Status:** `In Progress`

- [x] Items and menu items CRUD
- [x] BOM engine + cycle checks in shared package
- [ ] BOM API endpoints (get/update/explosion)
- [ ] Recipe versioning write path + retrieval
- [ ] UoM conversion validation flow
- [ ] Web BOM editor UX

## Milestone 4 — Modules C, D, E, F (Operational Core)

**Status:** `Not Started`

- [ ] Procurement domain APIs and lifecycle
- [ ] Inventory stock/transactions/counting APIs
- [ ] Sales-independent reorder signal baseline
- [ ] Warehousing receiving/picking/storage APIs
- [ ] Transfer/logistics APIs and state transitions
- [ ] Tenant-boundary integration tests for each implemented domain

## Milestone 5 — Module G (DialTone Ingestion + Depletion Loop)

**Status:** `Not Started`

- [ ] DialTone ingestion endpoint with signature verification
- [ ] Idempotent upsert (`source_system`, `source_order_id`)
- [ ] Channel map endpoints and unmapped-item queue path
- [ ] BOM-driven depletion transaction writes
- [ ] Traceability from order -> depletion transaction

## Milestone 6 — Modules H + I (Costing + Predictive AI)

**Status:** `Not Started`

- [ ] Costing endpoints (plate cost, snapshots, trend support)
- [ ] Forecasting and alert APIs with explainable payloads
- [ ] AI insight + invoice extraction paths
- [ ] `apps/ml` scaffold and API integration contract

## Milestone 7 — Platform Hardening + Launch Readiness

**Status:** `Not Started`

- [ ] Offline-first mobile thin slice (counts/receiving queue + sync status)
- [ ] `apps/jobs` scaffold for scheduled workloads
- [ ] `supabase/` scaffold (config, migrations, policies, seed)
- [ ] CI baseline (`.github/workflows/ci.yml`)
- [ ] Security hardening checklist (webhooks, least-privilege keys, auditability)

---

## Exit Criteria (PRD-Aligned)

- [ ] Modules A through I each have at least one implemented API slice matching PRD acceptance intent.
- [ ] No in-scope implemented route returns `501`.
- [ ] DialTone -> Toast -> Square connector path is executable in code (not just documented).
- [ ] Inventory ledger, stock projections, and depletion loop are operational end-to-end.
- [ ] Offline mobile thin slice is demonstrable on reconnect sync.
- [ ] CI enforces `pnpm typecheck`, `pnpm lint`, and `pnpm test` on PRs.

---

## Risks and Guardrails

- **Scope spread across all PRD modules**  
  Guardrail: enforce milestone sequencing and keep each milestone definition-of-done explicit.

- **Connector sequencing drift**  
  Guardrail: maintain fixed order (`dialtone` -> `toast` -> `square`) in implementation contracts.

- **Tenant isolation regressions**  
  Guardrail: add integration tests per domain route group as modules come online.

- **Offline mobile complexity**  
  Guardrail: deliver capture -> queue -> sync thin slice before broader mobile feature breadth.

- **AI overreach in v1**  
  Guardrail: keep recommendations explainable and human-confirmed; no autonomous mutations.

---

## Source of Truth Documents

- `docs/PRD-SupplyFlow.md`
- `docs/market-validation.md`
- `docs/tech-stack-and-approach.md`
- `docs/process-flow-pos-to-procurement.md`
- `developer/developer-journal.md`
