# TPT Agriculture

Offline-first farm management for New Zealand agriculture. Built with Tauri 2 (desktop) + PWA (web), React, Drizzle ORM, and SQLite.

No cloud required — all data lives locally on your device.

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Rust toolchain (for Tauri desktop builds)

### Install & Run

```bash
pnpm install
pnpm desktop:dev
```

This opens the Tauri desktop app with hot-reload.

### PWA (Browser)

```bash
pnpm install
pnpm --filter @tpt/desktop dev
```

Then open `http://localhost:1420` in Chrome or Firefox.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm desktop:dev` | Run Tauri desktop in dev mode |
| `pnpm desktop:build` | Build desktop installer (.exe / .dmg) |
| `pnpm typecheck` | Type-check all packages |
| `pnpm build` | Build all packages |

## Architecture

```
tpt-agriculture/
  apps/desktop/          Tauri 2 + Vite + React
  packages/core/         Drizzle schema, DB adapters, module registry
  packages/ui/           Shared React components
  packages/modules/      19 domain modules (field-management, sheep, cattle-dairy, etc.)
```

### Modules

Each module in `packages/modules/` contains:
- `service.ts` — CRUD functions using Drizzle ORM
- `schemas.ts` — Zod validation schemas
- `nav.ts` — Navigation config

### Database

- **Desktop**: Tauri `plugin-sql` (SQLite via OS-native driver)
- **PWA**: `wa-sqlite` + Origin Private File System (OPFS)
- **Schema**: Drizzle ORM with SQLite tables defined in `packages/core/src/schema/`

The database initializes automatically on first launch. Run `pnpm db:generate` after schema changes.

## Tech Stack

- [Tauri 2](https://v2.tauri.app/) — Desktop app framework
- [React 19](https://react.dev/) — UI
- [Drizzle ORM](https://orm.drizzle.team/) — Database layer
- [TanStack Query](https://tanstack.com/query/) — Server state management
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — PWA support

## License

Apache 2.0
