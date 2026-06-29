# TPT Agriculture Platform — Task Tracker

> Stack: Next.js 15 (App Router) | Supabase (Postgres + Auth + Storage) | Vercel | pnpm monorepo + Turborepo | Electron (desktop shell) | PWA (offline)

---

## Phase 1 — Foundation ✓ (2026-05-26) [Superseded by Phase 1b — SaaS pivot]

Built as self-hosted Vite + React + Express. Replaced in Phase 1b with Next.js + Supabase SaaS stack.

---

## Phase 1b — SaaS Foundation Rewrite (current sprint)

- [x] Update `packages/core` — new Prisma schema (Profile, Tenant, TenantUser, Subscription), Supabase client factory, bundle-modules config, module registry, access helper
- [x] Delete `apps/api` + `apps/licence-server` (replaced by Next.js API routes)
- [ ] Create `apps/web` (Next.js 15) — scaffold, Tailwind, Supabase auth, middleware, layout
- [ ] Auth pages — login, register (creates Profile + Tenant + TenantUser)
- [ ] Stripe routes — webhook (checkout, subscription events), checkout session creator
- [ ] Onboarding wizard — country → bundle selection → farm size (ha / m² per indoor type) → Stripe Checkout → done
- [ ] PWA — manifest.json, next-pwa + Workbox config, BackgroundSync offline writes, offline-ready toast
- [ ] Dashboard + Settings pages (subscription status, renewal date, add ha/m² packs)
- [ ] Update `.env.example` for Supabase + Stripe stack
- [ ] Deploy to Vercel (staging), connect Supabase project

---

## Phase 2 — Horticulture Modules ✓ (2026-05-26)

- [x] `packages/modules/field-management` — Farm → Field CRUD, map/grid of plots
- [x] `packages/modules/crop-planning` — Calendar, planting schedules, task list
- [x] `packages/modules/harvest-tracking` — Yield entry, batch records, grade tracking
- [x] `packages/modules/pest-spray-log` — Spray events, chemical register, withholding periods
- [x] `packages/modules/viticulture` — Block/row management, canopy notes, brix tracking, vintage records
- [x] `packages/modules/orchard` — Tree inventory, spray programs, harvest bins
- [x] `packages/modules/vegetables` — Bed/row tracking, succession planting
- [x] `packages/modules/microgreens` — Tray tracking, 7–14 day cycles, variety + substrate, yield per tray, batch revenue (billed per m²)
- [x] `packages/modules/protected-cropping` — Greenhouse/tunnel structure records, climate log, fertigation (billed per m²)
- [x] `packages/modules/aquaponics` — Fish stock + grow beds, water quality (pH/ammonia/nitrate/DO), feeding schedules, plant bed yields (billed per m²)

Each module: `package.json` + `tsconfig.json` + `src/{index,nav,schemas,service}.ts`. Prisma models in `packages/core/prisma/schema.prisma`. Dynamic route at `apps/web/app/(app)/modules/[moduleId]/page.tsx`.

---

## Phase 3 — Livestock Modules

- [ ] `packages/modules/cattle-dairy` — Herd records, milk production, SCC, drying off
- [ ] `packages/modules/cattle-beef` — Mob tracking, weight gain records, drafting targets
- [ ] `packages/modules/sheep` — Flock records, lambing %, drenching, shearing, wool
- [ ] `packages/modules/goats` — Herd, milking records, fibre tracking
- [ ] `packages/modules/deer` — Velvet records, stag/hind management, venison
- [ ] `packages/modules/pigs` — Sow records, litter tracking, feed conversion
- [ ] `packages/modules/poultry` — Flock batches, egg production, mortality log
- [ ] `packages/modules/bees` — Hive inspections, honey harvest, mite treatment, queen records
- [ ] `packages/modules/pasture` — Paddock rotation, cover measurement, feed budget

---

## Phase 4 — Platform Feature Modules

- [ ] `packages/modules/financials` — Income/expense ledger, ROI per enterprise, GST summary
- [ ] `packages/modules/inventory` — Chemical, seed, feed and fertiliser stock; movements; low-stock alerts
- [ ] `packages/modules/equipment` — Asset register, maintenance log, WOF/COF reminders
- [ ] `packages/modules/weather` — Open-Meteo integration, daily weather log, spray window calculator
- [ ] `packages/modules/compliance` — Regulatory checklist per country profile, audit-ready document store
- [ ] `packages/modules/staff` — Roster, timesheets, task assignment, contractor records
- [ ] `packages/modules/soil-water` — Soil test records, nutrient budget, irrigation log

---

## Phase 5 — Reporting & Analytics

- [ ] Reporting engine — per-module PDF (React-PDF) + CSV export
- [ ] Dashboard analytics — module-specific charts (Recharts or Tremor)
- [ ] Notifications — Vercel Cron-based reminders, in-app notification centre
- [ ] File attachments — Supabase Storage, link to any record

---

## Phase 6 — Desktop & Distribution

- [ ] `apps/desktop` — Electron shell wrapping Vercel-hosted app; PWA handles offline (~2 month limit)
- [ ] Electron: tray icon, local file export, OS notifications
- [ ] Installer builds — `electron-builder` `.exe` (Windows) + `.dmg` (Mac)
- [ ] Per-bundle installer variants (Horticulture, Livestock, Full Platform)

---

## Notes

- **SaaS model**: Supabase + Vercel, no self-hosted server required
- **Pricing**: Setup fee (one-time, via Stripe) + annual subscription
  - Outdoor modules (cropping, livestock, pasture) — billed by **hectares**, 50ha add-on packs
  - Indoor/specialty modules (microgreens, aquaponics, protected cropping) — billed by **m²** at different per-module rates
  - All sizes stored on `Subscription.hectares` / `Subscription.indoorSqm` (JSON map per module type)
- **Free trial**: 30 days, no card required
- **Access model**: Standard SaaS — pay annually or lose access. `Subscription.status` ACTIVE/TRIALING = access; PAST_DUE/CANCELLED/UNPAID = blocked at `currentPeriodEnd`
- **Module access**: `Subscription.bundleTier` + `BUNDLE_MODULES` config at runtime — no join table
- **Offline**: PWA primary (~2 month cache limit before reconnect required); Electron = desktop shell wrapping Vercel URL, same PWA offline layer
- **Data access**: All farm data lives in Supabase — query any tenant's data directly via Supabase Studio or API
- **Country profiles**: JSON config per country (units, currency, compliance fields)
- **Module system**: Each `packages/modules/*` package exports a Next.js route handler, nav config, and Prisma migration; registered statically via `MODULE_REGISTRY`
