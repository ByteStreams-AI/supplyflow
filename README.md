# SupplyFlow

> Real-Time Supply for Real-World Kitchens

SupplyFlow is a multi-tenant SaaS restaurant supply-chain platform. It gives independent restaurants and small chains real-time control over procurement, inventory, warehousing, logistics, and food cost — driven by actual sales rather than guesswork.

---

## Overview

Every menu item is backed by a **Bill of Materials (BOM)**, so when a sale happens, stock is depleted to the ingredient level automatically and true plate cost is always known. SupplyFlow is AI-forward: predictive sourcing, demand forecasting, price-trend modeling, and shortage detection ship at launch.

**Core capabilities:**
- Procurement across multiple vendors with sole-source risk flagging and JIT ordering
- Live inventory driven by BOM-linked sales depletion (via DialTone integration)
- Warehousing: mobile receiving, picking, bin/zone management, expiry tracking
- Inter-location transfers for multi-site groups and commissary operations
- Always-current plate cost and food-cost % based on live ingredient pricing
- Predictive AI: demand forecasting, price-trend prediction, shortage detection, Claude-powered insights and invoice extraction

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | TypeScript · Hono · Cloudflare Workers |
| Database | Supabase (PostgreSQL) · Drizzle ORM · Row-Level Security |
| Web | React 19 · Vite · TanStack Router/Query · Tailwind CSS |
| Mobile | React Native · Expo · WatermelonDB (offline-first) |
| ML / AI | Python 3.12 · FastAPI · Prophet · LightGBM · Claude API |
| Auth | Supabase Auth (email/password, Google, Apple) |
| Billing | Stripe Subscriptions |
| Email | Resend |
| Jobs | Cloudflare Cron Triggers · Cloudflare Queues |

See [`docs/tech-stack-and-approach.md`](docs/tech-stack-and-approach.md) for the full architecture.

---

## Repository Structure

```
supplyflow/
├── apps/
│   ├── api/        # Hono API — Cloudflare Workers
│   ├── web/        # React + Vite web app
│   ├── mobile/     # React Native + Expo mobile app
│   ├── ml/         # Python FastAPI ML/AI service
│   └── jobs/       # Cloudflare Workers cron jobs
├── packages/
│   ├── types/      # Shared TypeScript domain types + Zod schemas
│   ├── db/         # Drizzle schema, Supabase client, RLS helpers
│   ├── bom/        # BOM explosion engine (pure TS)
│   └── ui/         # Shared design system (Radix UI + Tailwind)
├── supabase/       # Migrations, RLS policies, seed data
├── docs/           # PRD, tech stack, architecture docs
└── developer/      # Developer journal and internal notes
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (Cloudflare)
- Python 3.12+ with [uv](https://github.com/astral-sh/uv) (ML service only)

### Install dependencies

```bash
pnpm install
```

### Start local Supabase

```bash
supabase start        # starts Postgres, Realtime, Auth, Storage locally
supabase db push      # apply migrations
supabase db seed      # load dev tenant, test users, sample catalog
```

### Start development servers

```bash
pnpm dev              # starts api, web, and jobs in parallel via Turborepo
```

### ML service (optional)

```bash
cd apps/ml
uv sync
uv run uvicorn main:app --reload
```

### Environment variables

Copy `.env.example` to `.env.local` (git-ignored) and fill in values from `supabase status`:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=           # Stripe test mode key
ANTHROPIC_API_KEY=
RESEND_API_KEY=
DIALTONE_WEBHOOK_SECRET=
```

---

## Documentation

| Document | Description |
|---|---|
| [`docs/PRD-SupplyFlow-2026-05-21.md`](docs/PRD-SupplyFlow-2026-05-21.md) | Full Product Requirements Document |
| [`docs/tech-stack-and-approach.md`](docs/tech-stack-and-approach.md) | Tech stack, architecture decisions, and implementation patterns |
| [`developer/developer-journal.md`](developer/developer-journal.md) | Running developer journal |

---

## Development Phases

| Phase | Scope | Target Exit |
|---|---|---|
| **0 — Foundation** | Multi-tenancy, auth, RLS, Stripe billing skeleton | Tenant self-onboards; isolation verified |
| **1 — Catalog & Inventory Core** | Items, BOM editor, inventory ledger, par levels | BOMs exist; live stock balances correct |
| **2 — Procurement & Warehousing** | Vendors, POs, mobile receiving, picking | Full procure-to-receive cycle |
| **3 — DialTone Integration & Costs** | Order ingestion, depletion, plate cost, ABC | Sales auto-deplete stock; food cost is live |
| **4 — Logistics & Predictive AI** | Transfers, delivery calendar, forecasting, Claude insights | AI-forward v1; full O1–O6 coverage |
| **5 — Hardening & Launch** | Offline sync, perf, security review, pilot | Launch-ready |

---

## Related Projects

- **DialTone** (`dialtone.menu`) — ByteStreams voice-AI phone ordering agent; v1 sales channel for SupplyFlow
