# AGENTS.md

## Quick reference

```bash
pnpm install                    # Install all workspace deps
pnpm typecheck                  # Type-check all packages (fastest verification)
pnpm build                      # Build all packages via Turborepo
pnpm lint                       # Lint all packages
pnpm desktop:dev                # Tauri desktop app (opens native window)
pnpm --filter @tpt/desktop dev  # PWA in browser at localhost:1420
pnpm db:generate                # Generate Drizzle migration SQL after schema changes
pnpm db:migrate                 # Apply pending migrations
```

Requires: Node.js >= 20, pnpm >= 9, Rust toolchain (Tauri builds only).

## Architecture

Pnpm monorepo (Turborepo). Three workspace areas:

- **`apps/desktop/`** — Tauri 2 + Vite + React 19. Rust backend (`src-tauri/`) is minimal; almost all logic is frontend. Dev port: 1420.
- **`packages/core/`** — Drizzle ORM schema (`src/schema/`), DB adapter abstraction, reference data, module registry. **Source of truth for all table definitions.**
- **`packages/ui/`** — Shared React components (`DashboardShell`, `Layout`, `Sidebar`, form primitives).
- **`packages/modules/`** — 19 domain modules (field-management, crop-planning, sheep, cattle-dairy, etc.). Each exports `service.ts` (Drizzle CRUD) and `index.ts` (schemas + nav config).

## Two-layer module system

Modules live in two places that must stay in sync:

1. **`packages/modules/<name>/src/`** — Zod schemas, nav config, service functions. Package name: `@tpt/module-<name>`.
2. **`apps/desktop/src/modules/registry.ts`** — `MODULE_ADAPTERS` object. Defines columns, form fields, and CRUD for dynamic table rendering. Uses `ModuleAdapter` interface from `module-adapter.ts`.

When adding a new module: create the package, then register it in `registry.ts`. The adapter's `list`/`create`/`update`/`delete` functions use `@tpt/core` schema tables directly — they don't call module service functions.

## Schema changes

Schema lives in `packages/core/src/schema/` (split by domain: `farm.ts`, `livestock.ts`, `horticulture.ts`, etc.). After any change:

```bash
pnpm db:generate   # Produces SQL in packages/core/migrations/
pnpm db:migrate    # Applies to local SQLite
```

Drizzle config: `packages/core/drizzle.config.ts` (dialect: sqlite).

## Platform split: Desktop vs PWA

DB adapter in `apps/desktop/src/db/` selects driver at runtime:
- **Desktop (Tauri)**: `plugin-sql` — native OS SQLite
- **PWA (browser)**: `wa-sqlite` + OPFS (runs in a Web Worker)

**Never call Tauri APIs directly from shared packages.** All DB access goes through the adapter abstraction.

## Key conventions

- **TypeScript strict mode** — `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are on. These cause real type errors if you're not careful with optional fields and indexed access.
- **Forms**: React Hook Form + Zod schemas. Form fields use `optionsKey` to reference `DEFAULT_OPTIONS` in `@tpt/core` or `foreignKey` for live module lookups.
- **Data fetching**: TanStack Query v5 wrapping module service functions.
- **Styling**: Tailwind CSS v4 via Vite plugin. No `tailwind.config.js` — config is in CSS.
- **No test suite** — there are no test files in the repo. Verification is typecheck + build.
- **No CI workflows** — no `.github/workflows/` directory.
- **Offline-first** — no backend API calls except weather services (open-meteo, etc.).

## Module registry categories

The `MODULE_REGISTRY` in `packages/core/src/config/modules.ts` defines three categories:
- **horticulture** — field-management, crop-planning, viticulture, orchard, etc. (billing: hectares or sqm)
- **livestock** — cattle-dairy, cattle-beef, sheep, goats, deer, pigs, poultry, bees, pasture (billing: hectares)
- **platform** — financials, inventory, equipment, weather, compliance, staff, soil-water, decision-support (included)

The registry also includes modules (forestry, mushroom, nursery, input-prices, output-prices) that have adapters in `registry.ts` but aren't in the original 19 `packages/modules/` — they're defined inline.

## Gotchas

- The `predev` script in desktop runs `kill-port 1420` — stale Vite processes will block dev startup.
- `wa-sqlite` is excluded from Vite's dep optimization (`optimizeDeps.exclude`) — don't re-add it.
- The `allowBuilds` in `pnpm-workspace.yaml` disables Prisma builds — this project uses Drizzle, not Prisma.
- Module adapters in `registry.ts` use `getDb()` from `@tpt/core` (the desktop app's DB), not the module package's own imports. The module packages' `service.ts` files also call `getDb()` but are mostly unused by the UI — the registry is the real CRUD layer.
- `.env.example` references Supabase/Stripe but the app is offline-first SQLite. Those env vars appear to be vestigial.
