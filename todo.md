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
- [ ] Wire each module's service into React Query hooks in app
- [ ] Test CRUD for at least one horticulture + one livestock module end-to-end

## Phase 5 — Tauri Build
- [x] Configure `tauri.conf.json`: app name, identifier, window size *(done in scaffold)*
- [ ] Add app icons (1024x1024 PNG → run `pnpm tauri icon <source.png>`) — **blocked: needs source icon PNG**
- [ ] Run `pnpm desktop:build` on Windows → confirm `.exe` installer produced
- [ ] Run `pnpm desktop:build` on Mac → confirm `.dmg` produced
- [ ] Test: install from `.exe`, launch, create farm, add record, reinstall → data persists

## Phase 6 — PWA Polish
- [x] Tune `vite-plugin-pwa`: precache shell, all-local data (no network fetches)
- [ ] Test: install PWA in Chrome → go offline → confirm all navigation works
- [ ] Test: add record offline → reload → record persists (OPFS SQLite)
- [ ] Add install prompt banner (show when `beforeinstallprompt` fires)
- [ ] Run Lighthouse PWA audit → achieve 100 PWA score

## Phase 7 — Encrypted Backup (optional)
> Integrates with backup.tptsolutions.co.nz. Zero-knowledge: server never sees plaintext.

- [ ] Add `@tauri-apps/plugin-stronghold` for OS keychain storage
- [ ] Generate 256-bit key on farm setup using Argon2id
- [ ] Encode key as 24-word BIP39 recovery phrase
- [ ] Build recovery phrase screen with **"Email to myself"** button (opens `mailto:` link, works offline)
- [ ] Build recovery phrase screen with **"Copy to clipboard"** button
- [ ] Add mandatory "I have saved my recovery phrase" checkbox — setup blocks until ticked
- [ ] Store key in Tauri Stronghold (desktop) / encrypted IndexedDB (PWA)
- [ ] Add Settings → Backup → "View recovery phrase" (OWNER only, requires password re-entry)
- [ ] Implement: SQLite export → AES-256-GCM encrypt → upload to backup.tptsolutions.co.nz
- [ ] Implement: download backup list → select → enter recovery phrase → decrypt → import
- [ ] Test: backup → fresh install → restore with phrase → data matches

## Cleanup ✅
- [x] Remove `apps/web/` (entire Next.js app)
- [x] Remove Supabase, Stripe, Prisma, next-pwa from all `package.json` files
- [x] Remove `vercel.json` (was already absent)
- [ ] Update root README with new setup instructions
- [x] Confirm `pnpm typecheck` passes with zero errors *(desktop + core + all 19 modules + UI pass; apps/web removed)*
