# TPT Agriculture — Redevelopment Checklist
> Tauri 2 Desktop + PWA | Offline-first | Open Source Apache | No cloud required

---

## Phase 0 — Scaffold ✅
- [x] Add `apps/desktop/` directory
- [x] Init Tauri 2 + Vite + React inside `apps/desktop/`
- [x] Add `apps/desktop` to pnpm workspace and Turborepo pipeline
- [ ] Confirm `pnpm desktop:dev` opens a working Tauri window *(run manually)*
- [x] Add `vite-plugin-pwa` to Vite config
- [x] Confirm PWA manifest + service worker generated in build output

## Phase 1 — Database Layer ✅
- [x] Remove `packages/core/prisma/` folder
- [x] Add Drizzle ORM + Drizzle Kit to `packages/core`
- [x] Write Drizzle schema: `identity.ts` (users, sessions)
- [x] Write Drizzle schema: `farm.ts` (farms, farm_users)
- [x] Write Drizzle schema: `horticulture.ts` (all horticulture tables)
- [x] Write Drizzle schema: `livestock.ts` (all livestock tables)
- [x] Write `apps/desktop/src/db/adapter-tauri.ts` (plugin-sql SQLite)
- [x] Write `apps/desktop/src/db/adapter-web.ts` (wa-sqlite + OPFS)
- [x] Write `apps/desktop/src/db/index.ts` (`getDb()` with platform detection)
- [x] Run `drizzle-kit generate` → confirm migration SQL files created
- [ ] Test: DB initialises on first launch in Tauri window
- [ ] Test: DB initialises in browser PWA (Chrome/Firefox with OPFS)

## Phase 2 — Local Auth ✅
- [x] Create `apps/desktop/src/auth/` module
- [x] Build "Create Farm" setup wizard (farm name + owner account)
- [x] Build login screen (email + password, bcrypt verify)
- [x] Implement session context (React context + `useSession` hook)
- [x] Add route guard: redirect to `/login` if no active session
- [ ] Test: create farm → restart app → login works correctly

## Phase 3 — App Shell ✅
- [x] Set up React Router v7 with all main routes
- [x] Port sidebar + layout from `packages/ui/` components
- [x] Build dashboard with module cards
- [x] Build Settings → Users page (OWNER can add/edit/remove users)
- [x] Build Settings → Farm (edit farm name, view farm ID)
- [x] Build generic `ModulePage` — CRUD table + inline form driven by any `ModuleAdapter`
- [ ] Test: all routes navigate correctly with correct layout

## Phase 4 — Module Services ✅
- [x] Update `packages/modules/field-management/src/service.ts` → Drizzle
- [x] Update `packages/modules/crop-planning/src/service.ts` → Drizzle
- [x] Update `packages/modules/harvest-tracking/src/service.ts` → Drizzle
- [x] Update `packages/modules/pest-spray-log/src/service.ts` → Drizzle
- [x] Update `packages/modules/viticulture/src/service.ts` → Drizzle
- [x] Update `packages/modules/orchard/src/service.ts` → Drizzle
- [x] Update `packages/modules/vegetables/src/service.ts` → Drizzle
- [x] Update `packages/modules/microgreens/src/service.ts` → Drizzle
- [x] Update `packages/modules/protected-cropping/src/service.ts` → Drizzle
- [x] Update `packages/modules/aquaponics/src/service.ts` → Drizzle
- [x] Update `packages/modules/cattle-dairy/src/service.ts` → Drizzle
- [x] Update `packages/modules/cattle-beef/src/service.ts` → Drizzle
- [x] Update `packages/modules/sheep/src/service.ts` → Drizzle
- [x] Update `packages/modules/goats/src/service.ts` → Drizzle
- [x] Update `packages/modules/deer/src/service.ts` → Drizzle
- [x] Update `packages/modules/pigs/src/service.ts` → Drizzle
- [x] Update `packages/modules/poultry/src/service.ts` → Drizzle
- [x] Update `packages/modules/bees/src/service.ts` → Drizzle
- [x] Update `packages/modules/pasture/src/service.ts` → Drizzle
- [x] Define `ModuleAdapter` interface (`module-adapter.ts`) — columns, formFields, CRUD methods
- [x] Write `ModuleAdapter` implementation for all 19 modules (`registry.ts`) — Drizzle queries, column/field defs
- [x] Wire each module's service into React Query hooks in app (`use-module-query.ts`)
- [ ] Test CRUD for at least one horticulture + one livestock module end-to-end

## Phase 5 — Tauri Build
- [x] Configure `tauri.conf.json`: app name, identifier, window size *(done in scaffold)*
- [x] Add app icons (placeholder green square — replace with real 1024x1024 PNG)
- [x] Run `pnpm desktop:build` on Windows → confirm `.exe` installer produced
- [ ] Run `pnpm desktop:build` on Mac → confirm `.dmg` produced
- [ ] Test: install from `.exe`, launch, create farm, add record, reinstall → data persists

## Phase 6 — PWA Polish
- [x] Tune `vite-plugin-pwa`: precache shell, all-local data (no network fetches)
- [ ] Test: install PWA in Chrome → go offline → confirm all navigation works
- [ ] Test: add record offline → reload → record persists (OPFS SQLite)
- [x] Add install prompt banner (show when `beforeinstallprompt` fires)
- [ ] Run Lighthouse PWA audit → achieve 100 PWA score

## Phase 7 — Encrypted Backup ✅
> Integrates with backup.tptsolutions.co.nz. Zero-knowledge: server never sees plaintext.

- [x] Add `@tauri-apps/plugin-stronghold` for OS keychain storage
- [x] Generate 256-bit key on farm setup using crypto.getRandomValues()
- [x] Encode key as 24-word BIP39 recovery phrase
- [x] Build recovery phrase screen with **"Email to myself"** button (opens `mailto:` link, works offline)
- [x] Build recovery phrase screen with **"Copy to clipboard"** button
- [x] Add mandatory "I have saved my recovery phrase" checkbox — setup blocks until ticked
- [x] Store key in Tauri Stronghold (desktop) / localStorage (PWA)
- [x] Add Settings → Backup → "View recovery phrase" (OWNER only, requires password re-entry)
- [x] Implement: SQLite export → AES-256-GCM encrypt → upload to backup.tptsolutions.co.nz
- [x] Implement: download backup list → select → enter recovery phrase → decrypt → import
- [ ] Test: backup → fresh install → restore with phrase → data matches

## Cleanup ✅
- [x] Remove `apps/web/` (entire Next.js app)
- [x] Remove Supabase, Stripe, Prisma, next-pwa from all `package.json` files
- [x] Remove `vercel.json` (was already absent)
- [x] Update root README with new setup instructions
- [x] Confirm `pnpm typecheck` passes with zero errors *(desktop + core + all 19 modules + UI pass; apps/web removed)*

---

## Phase 8 — Bug Fixes
- [ ] Fix: add `await` to all `getDb()` calls in `apps/desktop/src/auth/auth-service.ts` (~lines 37, 81, 126, 147, 200, 207) — auth is completely broken without this
- [ ] Fix: validate password before revealing recovery phrase in `SettingsBackupPage.tsx` — call `verifyPassword()` before `retrieveBackupKey()`
- [ ] Fix: validate 24-word BIP39 phrase before restore attempt in `SettingsRestorePage.tsx` — currently accepts any string
- [ ] Fix: add `onError` callbacks to all module CRUD mutations in `ModulePage.tsx` — failures are currently silent
- [ ] Audit all other files calling `getDb()` for missing `await`

## Phase 9 — Missing Features
- [ ] Build Settings → Users: add/edit/remove farm members (OWNER only) — page is currently read-only
- [ ] Add toast/notification system (`sonner` or `react-hot-toast`) — wire to all mutation success/error callbacks across all 19 modules and backup pages
- [ ] Add search/filter input above module tables in `ModulePage.tsx` — client-side filter on displayed rows
- [ ] Add sortable column headers to module tables (click to sort asc/desc)
- [ ] Add module record counts to dashboard cards (e.g. "14 Fields", "3 Cows")
- [ ] Add upcoming events strip to dashboard (next withholding expiry, next scheduled harvest, next inspection)
- [ ] Add withholding period alert calculation to pest-spray-log (sprayDate + withholdingDays → surface on dashboard if still in window)
- [ ] Add chemical register PDF export button to pest-spray-log (GAP compliance — NZ farms required to keep records)
- [ ] Add planting calendar view to crop-planning module (toggle between table and month-grid, planned/in-progress/completed colour-coded)
- [ ] Build Settings → Farm: allow editing farm name and country profile — currently fully read-only

## Phase 10 — Country Profiles & Weather API
> All profiles use metric only (ha, kg, L, °C, kph). 10 built-in presets with per-farm overrides.
- [ ] Create `packages/core/src/config/country-profiles.ts` — 10 profiles: nz, au, us, uk, za, ca, in, br, fr, de
- [ ] Add `settingsJson` text column to `farms` schema (`packages/core/src/schema/farm.ts`) for per-farm overrides
- [ ] Create `apps/desktop/src/context/FarmSettingsContext.tsx` — resolves base profile + user overrides, exposes `useSettings()` hook
- [ ] Replace `toLocaleDateString()` / `toLocaleString()` in `apps/desktop/src/modules/registry.ts` with `Intl.DateTimeFormat(locale)` / `Intl.NumberFormat(locale)` — driven by active country profile locale
- [ ] Replace hardcoded "Registration Number" label in pest-spray-log adapter (`registry.ts`) with `settings.regulatory.chemicalRegNumber` (e.g. "ACVM Number" for NZ, "APVMA Number" for AU, "EPA Reg Number" for US)
- [ ] Build Settings → Farm: country profile dropdown (10 options) + weather API section + regulatory label overrides (OWNER/ADMIN only)
- [ ] Create `apps/desktop/src/weather/providers.ts` — typed registry of weather providers (Open-Meteo free, MetService, BoM, Met Office, NOAA, + Custom URL slot)
- [ ] Create `apps/desktop/src/weather/weather-service.ts` — provider-agnostic fetcher; cache last response in localStorage (1 hr TTL) for offline use
- [ ] Add "Test Connection" button for weather provider in settings — provider can only be saved after a live 2xx connectivity test passes; failed providers shown as grayed out
- [ ] Add "Custom" weather provider option — user enters any base REST URL + optional API key; system tests it before activating
- [ ] Add `lat` / `lon` columns to `farms` schema or manual coordinate input in SettingsFarmPage
- [ ] Surface current conditions weather widget on dashboard using active provider + farm coordinates
- [ ] Run `drizzle-kit generate` after schema changes → confirm new migration files created

## Phase 11 — Security Hardening
- [ ] Add `farmId` to backup envelope as AES-GCM additional authenticated data — verify on restore that it matches the current session's farmId
- [ ] Add HMAC auth header to all backup API requests (derive token from farm encryption key) — prevents unauthenticated farmId enumeration on backup.tptsolutions.co.nz
- [ ] Enable Content Security Policy in `apps/desktop/src-tauri/tauri.conf.json` — restrict to `self` + `https://backup.tptsolutions.co.nz`

## Phase 12 — Apache License & OSS Polish
- [ ] Add `LICENSE` file at repo root (full Apache 2.0 text, copyright TPT Solutions Ltd. 2024)
- [ ] Add `// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0` header to all `.ts` / `.tsx` files under `apps/desktop/src/`
- [ ] Replace placeholder app icons in `apps/desktop/src-tauri/icons/` with final TPT Agriculture artwork (provide 1024×1024 PNG → run `tauri icon` to regenerate all sizes)
