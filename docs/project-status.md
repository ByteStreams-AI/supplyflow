# SupplyFlow — Project Status

**Project Start:** May 21, 2026  
**Last Update:** June 3, 2026  
**Current Stage:** Foundation complete; now executing a market-aligned 2-week wedge plan.

---

## Current Snapshot

- Monorepo structure is in place (`apps/*`, `packages/*`, Turbo + pnpm workspace).
- API middleware and route groups are scaffolded, but most business routes still return `501`.
- Shared packages exist; `packages/bom` is implemented and tested.
- Web app is scaffolded with minimal UI; mobile app is package-level scaffold only.
- Market direction is now explicit: target **3–30 location operators** with a wedge around **BOM accuracy + sale-to-reorder automation**.

### Health signals (latest run)

- `pnpm typecheck`: **failing** in `packages/types/src/index.ts` (duplicate exports: `StorageZone`, `StorageZoneSchema` from `catalog` and `inventory`).
- `pnpm lint`: **blocked** by the same build/type issue.
- `pnpm test`: **partially passing** — `@supplyflow/bom` has 9/9 passing tests; broader app/package coverage is still missing.

---

## Market Alignment Constraints (from `docs/market-validation.md`)

1. **Target segment:** independent multi-location operators and small regional chains (3–30 locations).
2. **Wedge to lead with:** deep BOM/sub-recipe costing + POS sale → depletion → reorder loop.
3. **Integration strategy:** prioritize `dialtone.menu` as the first ingestion path; keep Toast and Square as second and third connector priorities.
4. **Operational differentiator:** treat offline mobile counting as a headline capability, not a later add-on.
5. **AI requirement:** recommendations must be explainable (include rationale), not opaque.
6. **Adoption risk control:** reduce onboarding friction early (catalog setup/import, fast time-to-value).

---

## 2-Milestone Execution Plan (June 3 → June 16)

## Primary outcomes

1. Baseline is green: root `typecheck`, `lint`, and `test` pass.
2. Catalog + inventory foundations are operational and ready for depletion/reorder workflows.
3. First ingestion path is chosen and started as `dialtone.menu`, with Toast and Square documented as second and third connector priorities.
4. Offline mobile counting is in active implementation scope (thin slice delivered).
5. Explainable recommendation payload shape is defined for reorder/AI guidance surfaces.
6. CI baseline is live on pull requests.

## Milestone 1 — Stabilize core and lock market-critical decisions

- [x] **Milestone 1 complete**
- [x] **Unblock shared types and toolchain**
  - Resolve `StorageZone*` export collisions in `packages/types/src/index.ts`.
  - Re-run root validation commands until `typecheck` and `lint` complete cleanly.
- [x] **Harden lint/typecheck baseline**
  - Ensure eslint configuration is present and consistently wired across workspaces.
  - Fix any blocking lint/type errors discovered while wiring.
- [x] **Implement Catalog API slice**
  - Replace `501` handlers for:
    - `/v1/catalog/items` (list/create/get/update/delete)
    - `/v1/catalog/menu-items` (list/create/get/update)
  - Validate requests with `@supplyflow/types` Zod schemas.
  - Apply tenant-safe DB access pattern with RLS token setup before tenant-scoped queries.
- [x] **Implement minimal Catalog web flow**
  - Add basic list/create/edit screens for items/menu items.
  - Connect web forms to API endpoints and handle loading/error states.
- [x] **Confirm connector ordering (1: `dialtone.menu`, 2: Toast, 3: Square)**
  - Document the connector-order decision and rationale in implementation notes.
  - Document webhook/auth/idempotency and sales-line mapping contracts for `dialtone.menu` first, with follow-on requirements captured for Toast/Square; route implementation begins in Milestone 2.
- [x] **Add targeted tests**
  - Unit tests for validation/service logic.
  - API integration tests for catalog CRUD happy path + tenant isolation guard rails.

### Milestone 1 exit criteria

- [x] Root `pnpm typecheck` and `pnpm lint` pass.
- [x] Catalog endpoints return real data (no `501` in implemented paths).
- [x] Basic catalog flow is usable from web locally.
- [x] `dialtone.menu` is finalized as the first ingestion path, with Toast and Square explicitly documented as second and third.

## Milestone 2 — Deliver wedge runway (depletion path + offline + platform)

- [ ] **Milestone 2 complete**
- [ ] **Implement minimal Inventory slice**
  - `/v1/inventory/stock-levels` (read path)
  - `/v1/inventory/transactions` (ledger write path)
  - Wire cost-sensitive transaction handling where required (WAC-related flow boundaries defined and tested).
- [ ] **Start `dialtone.menu` ingestion baseline (first connector path)**
  - Add initial sales-ingestion endpoint and signature/idempotency handling.
  - Persist ingested orders into `sales_order` + `sales_order_line` structures.
  - Define and expose unmapped-item handling path (explicit exceptions, no silent drops).
- [ ] **Wire BOM-driven depletion starter path**
  - Connect ingested sales lines to BOM expansion/depletion service path (initial vertical capability).
  - Ensure traceability of depletion transactions to source order IDs.
- [ ] **Deliver offline mobile count thin slice**
  - Implement initial offline-first count capture and queued sync flow.
  - Surface basic sync status in app UX.
- [ ] **Create `supabase` baseline scaffold**
  - Add `supabase/config.toml`.
  - Add initial migrations and RLS policies for tenancy + catalog + inventory core entities.
  - Add a minimal dev seed dataset (tenant, location, user, core items).
- [ ] **Scaffold missing runtime services**
  - `apps/jobs`: wrangler config + placeholder job handlers.
  - `apps/ml`: FastAPI skeleton with health/readiness entrypoints.
- [ ] **Ship CI baseline**
  - Add `.github/workflows/ci.yml` for workspace `typecheck`, `lint`, and `test`.
  - Verify clean run on the branch before handoff.
- [ ] **Close docs + status loop**
  - Update `developer/developer-journal.md`.
  - Refresh this status doc with completed outcomes and next 2-week window.

### Milestone 2 exit criteria

- [ ] PR CI runs and enforces `typecheck` + `lint` + `test`.
- [ ] Catalog + inventory baseline is operational.
- [ ] `dialtone.menu` ingestion baseline is implemented with idempotency and traceability.
- [ ] Offline mobile count thin slice is demonstrable.
- [ ] `supabase`, `jobs`, and `ml` scaffolds are present and executable.

---

## Definition of Done for this window

- Root commands pass:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
- No `501` responses remain in catalog/inventory endpoints included in scope.
- At least one API integration test suite exists for implemented routes.
- CI workflow is active and required for merge.
- Connector order is concretely represented in documented contracts and endpoint plan: 1) `dialtone.menu`, 2) Toast, 3) Square.
- Offline counting has a working end-to-end thin slice (capture → queue → sync).

---

## Risks and guardrails

- **POS-platform bundling pressure (Toast/Square)**  
  Guardrail: execute a narrow wedge around BOM accuracy + automated depletion/reorder, not generic inventory parity.

- **Onboarding friction (catalog and supplier setup)**  
  Guardrail: prioritize fast-start flows, seeded demo data, and import-ready structures early.

- **Integration maintenance burden**  
  Guardrail: execute `dialtone.menu` first and delay secondary POS breadth (Toast/Square) until the first loop works reliably.

- **Scope creep into broad roadmap modules**  
  Guardrail: this window is constrained to wedge foundations only (catalog, inventory, `dialtone.menu` ingestion baseline, offline count thin slice).

- **RLS and tenant-isolation complexity**  
  Guardrail: keep tight test coverage on tenant boundaries for every implemented endpoint.

---

## Deferred beyond this 2-week window

- Full procurement lifecycle and vendor optimization automation
- POS connector expansion beyond `dialtone.menu` first path (Toast, then Square)
- Costing dashboards and snapshot automation
- Production-grade ML forecasting/trend pipelines and full AI assistant behavior
- Mobile offline sync hardening beyond thin-slice capabilities

---

## Source of truth documents

- `docs/market-validation.md`
- `docs/PRD-SupplyFlow.md`
- `docs/tech-stack-and-approach.md`
- `docs/process-flow-pos-to-procurement.md`
- `developer/developer-journal.md`
