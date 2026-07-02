# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install              # Install all workspace dependencies
pnpm desktop:dev          # Run Tauri desktop app with hot-reload (opens native window)
pnpm --filter @tpt/desktop dev  # Run PWA in browser at http://localhost:1420
pnpm desktop:build        # Build desktop installer (.exe / .dmg / .deb)
pnpm typecheck            # Type-check all packages
pnpm build                # Build all packages via Turborepo
pnpm db:generate          # Generate Drizzle migration SQL after schema changes
pnpm db:migrate           # Apply pending migrations
```

Requires: Node.js >= 20, pnpm >= 9, Rust toolchain (for Tauri builds).

## Architecture

Pnpm monorepo with Turborepo orchestration. Three workspace areas:

**`apps/desktop/`** — Tauri 2 + Vite + React 19 application. The Rust backend (`src-tauri/`) is minimal; almost all logic lives in the frontend. App ID: `nz.co.tptsolutions.agriculture`. Dev port: 1420.

**`packages/core/`** — Database layer shared across platforms. Contains Drizzle ORM schema (`src/schema/`), DB adapter abstraction, and SQL migrations (`migrations/`). After any schema change, run `db:generate` then `db:migrate`.

**`packages/ui/`** — Shared React components: `DashboardShell`, `Layout`, `Sidebar`, form primitives.

**`packages/modules/`** — 19 domain modules (field-management, crop-planning, harvest-tracking, sheep, cattle-dairy, cattle-beef, goats, deer, pigs, poultry, bees, aquaponics, microgreens, vegetables, protected-cropping, pest-spray-log, orchard, viticulture, pasture). Each module exports:
- `service.ts` — Drizzle CRUD functions
- `schemas.ts` — Zod validation schemas
- `nav.ts` — Navigation metadata (label, path, icon)
- `index.ts` — Public exports

Modules are registered in `apps/desktop/src/modules/registry.ts` via a `ModuleAdapter` pattern that maps module IDs to column definitions, form fields, and CRUD operations for dynamic table rendering.

## Platform Split: Desktop vs. PWA

The DB adapter in `apps/desktop/src/db/` selects the correct driver at runtime:
- **Desktop (Tauri)**: `plugin-sql` — native OS SQLite driver
- **PWA (browser)**: `wa-sqlite` + Origin Private File System (OPFS)

Any database-touching code must work through this abstraction. Do not call Tauri APIs directly from shared packages.

## Key Conventions

- **TypeScript strict mode** — `tsconfig.base.json` enables `strict`, `exactOptionalPropertyTypes`, and `noUncheckedIndexedAccess`.
- **Forms**: React Hook Form + Zod schemas from the relevant module's `schemas.ts`.
- **Data fetching**: TanStack Query v5 wrapping module service functions.
- **Styling**: Tailwind CSS v4 via Vite plugin (no `tailwind.config.js` — config is in CSS).
- **Auth**: Local-only, bcryptjs hashing, SQLite session storage, Tauri Stronghold for secure credential storage.
- The app is offline-first — no backend API calls except to weather services (open-meteo, etc.).
