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

## Phase 2 — Local Auth ⚠️ SUPERSEDED (see Phase 13)
> Removed entirely — this is a single-farmer/family desktop app, not multi-tenant
> SaaS, so accounts/passwords/PINs added no real security (physical access to
> the machine is the boundary) and only added friction. Replaced by an implicit
> single-farm model with no login screen at all. Original checklist kept below
> for history.
- [x] ~~Create `apps/desktop/src/auth/` module~~ (deleted in Phase 13)
- [x] ~~Build "Create Farm" setup wizard (farm name + owner account)~~ (replaced by farm-name-only wizard)
- [x] ~~Build login screen (email + password, bcrypt verify)~~ (removed)
- [x] ~~Implement session context (React context + `useSession` hook)~~ (removed)
- [ ] ~~Test: create farm → restart app → login works correctly~~ (n/a — no login)

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

## Phase 8 — Bug Fixes ✅
- [x] Fix: add `await` to all `getDb()` calls in `apps/desktop/src/auth/auth-service.ts` (~lines 37, 81, 126, 147, 200, 207) — auth is completely broken without this
- [x] Fix: validate password before revealing recovery phrase in `SettingsBackupPage.tsx` — call `verifyPassword()` before `retrieveBackupKey()`
- [x] Fix: validate 24-word BIP39 phrase before restore attempt in `SettingsRestorePage.tsx` — currently accepts any string
- [x] Fix: add `onError` callbacks to all module CRUD mutations in `ModulePage.tsx` — failures are currently silent
- [x] Audit all other files calling `getDb()` for missing `await` — fixed 19 `list` functions in `registry.ts` that were missing `await`

## Phase 9 — Missing Features
- [x] Build Settings → Users: add/edit/remove farm members (OWNER only) — **Done in original implementation**
- [x] Add toast/notification system (`sonner` or `react-hot-toast`) — **Done in original implementation**
- [x] Add search/filter input above module tables in `ModulePage.tsx` — **Done in original implementation**
- [x] Add sortable column headers to module tables (click to sort asc/desc) — **Done in original implementation**
- [x] Add chemical register PDF export button to pest-spray-log (GAP compliance — NZ farms required to keep records) — **Already implemented**
- [x] Add module record counts to dashboard cards (e.g. "14 Fields", "3 Cows") — **Done in original implementation**
- [x] Add upcoming events strip to dashboard (next withholding expiry, next scheduled harvest, next inspection) — **Done in original implementation**
- [x] Add withholding period alert calculation to pest-spray-log (sprayDate + withholdingDays → surface on dashboard if still in window) — **Done in original implementation**
- [x] Add planting calendar view to crop-planning module (toggle between table and month-grid, planned/in-progress/completed colour-coded) — **Done in original implementation**
- [x] Build Settings → Farm: allow editing farm name and country profile — **Done in original implementation**

## Phase 10 — Country Profiles & Weather API
> All profiles use metric only (ha, kg, L, °C, kph). 10 built-in presets with per-farm overrides.
- [x] Create `packages/core/src/config/country-profiles.ts` — 10 profiles: nz, au, us, uk, za, ca, in, br, fr, de
- [x] Add `settingsJson` text column to `farms` schema (`packages/core/src/schema/farm.ts`) for per-farm overrides
- [x] Create `apps/desktop/src/context/FarmSettingsContext.tsx` — resolves base profile + user overrides, exposes `useSettings()` hook
- [x] Replace `toLocaleDateString()` / `toLocaleString()` in `apps/desktop/src/modules/registry.ts` with `Intl.DateTimeFormat(locale)` / `Intl.NumberFormat(locale)` — driven by active country profile locale
- [x] Replace hardcoded "Registration Number" label in pest-spray-log adapter (`registry.ts`) with `settings.regulatory.chemicalRegNumber` (e.g. "ACVM Number" for NZ, "APVMA Number" for AU, "EPA Reg Number" for US)
- [x] Build Settings → Farm: country profile dropdown (10 options) + weather API section + regulatory label overrides (OWNER/ADMIN only)
- [x] Create `apps/desktop/src/weather/providers.ts` — typed registry of weather providers (Open-Meteo free, MetService, BoM, Met Office, NOAA, + Custom URL slot)
- [x] Create `apps/desktop/src/weather/weather-service.ts` — provider-agnostic fetcher; cache last response in localStorage (1 hr TTL) for offline use
- [x] Add "Test Connection" button for weather provider in settings — provider can only be saved after a live 2xx connectivity test passes; failed providers shown as grayed out
- [x] Add "Custom" weather provider option — user enters any base REST URL + optional API key; system tests it before activating
- [x] Add `lat` / `lon` columns to `farms` schema or manual coordinate input in SettingsFarmPage
- [x] Surface current conditions weather widget on dashboard using active provider + farm coordinates
- [x] Run `drizzle-kit generate` after schema changes → confirm new migration files created

## Phase 11 — Security Hardening
- [x] Add `farmId` to backup envelope as AES-GCM additional authenticated data — verify on restore that it matches the current session's farmId
- [x] Add HMAC auth header to all backup API requests (derive token from farm encryption key) — prevents unauthenticated farmId enumeration on backup.tptsolutions.co.nz
- [x] Enable Content Security Policy in `apps/desktop/src-tauri/tauri.conf.json` — restrict to `self` + `https://backup.tptsolutions.co.nz`

## Phase 12 — Apache License & OSS Polish
- [x] Add `LICENSE` file at repo root (full Apache 2.0 text, copyright TPT Solutions Ltd. 2024)
- [x] Add `// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0` header to all `.ts` / `.tsx` files under `apps/desktop/src/`
- [ ] Replace placeholder app icons in `apps/desktop/src-tauri/icons/` with final TPT Agriculture artwork (provide 1024×1024 PNG → run `tauri icon` to regenerate all sizes)

## Phase 13 — Remove Accounts, Implicit Single Farm ✅
> Single farmer/family desktop app — physical machine access is the real
> security boundary, so login/passwords/PINs only added friction with no real
> protection. Replaced with one implicit farm, no accounts at all.
- [x] Delete `apps/desktop/src/auth/` entirely (login, setup, profile picker, PIN, forgot-password, route guard, context, service)
- [x] Delete `SettingsUsersPage.tsx` and its nav entry — no multi-user management
- [x] Drop `users` / `sessions` / `farm_users` tables (migration `0003_groovy_robbie_robertson`)
- [x] Remove role-dependent `getAccessibleModules`/`canWrite`/`canAdmin` from `packages/core/src/access.ts` (kept `assertModuleAccess`, unrelated to roles)
- [x] Add `apps/desktop/src/farm/` — `FarmContext` (implicit single farm), `RequireFarm` (replaces `RequireAuth`), `FarmSetupPage` (farm name only, no owner account)
- [x] Repoint every page reading `user.farmId`/`role`/`email` to `useFarm()`
- [x] Drop password/OWNER gates on Backup/Restore pages — recovery-phrase requirement is the real protection, already in place
- [x] Fix BIP39 wordlist bug found along the way — hand-rolled list was short 23 words (2025 vs required 2048), causing blank words in the recovery phrase; replaced with `@scure/bip39`'s audited wordlist
- [x] Fix DB row-mapping bug found along the way — both Tauri/PWA adapters returned keyed objects instead of positional arrays for `all`/`get`, silently corrupting every non-identity SQL query result
- [x] Fix Tauri `sql:allow-execute` capability missing from `capabilities/default.json` — all inserts/updates were silently blocked
- [x] Fix Tauri Stronghold plugin build error (`Builder::default()` doesn't exist) — switched to `Builder::with_argon2(salt_path)`
- [x] Fix pnpm `allowBuilds`/`onlyBuiltDependencies` misconfiguration in `pnpm-workspace.yaml` blocking every install
- [ ] Test: fresh install → farm name → recovery phrase → dashboard, no login screen ever appears *(verified manually this session — re-verify after future schema changes)*

## Phase 14 — Module Picker + Reference Data ✅
> Farmer picks which of the 19 modules they actually use (most farms don't run
> all of them), changeable later in Settings. Breed/species/variety/irrigation
> type/soil type fields get starter dropdown lists instead of blank free text,
> with a "+ Add new…" to extend them per farm.
- [x] Fix pre-existing bug: `FarmSettingsContext.tsx` had its own NZ-only stub instead of importing the already-complete 10-country `packages/core/src/config/country-profiles.ts` — non-NZ country selection silently fell back to NZ locale/units
- [x] Build `ModulePicker` component (checkbox grid by category + Horticulture/Livestock/Everything presets, from `BUNDLE_MODULES`/`MODULE_REGISTRY`)
- [x] Wire `ModulePicker` into `FarmSetupPage.tsx` as step 2 of setup (after farm name)
- [x] Store `enabledModuleIds: string[]` in `farms.settingsJson` (same pattern as existing `weatherProvider` setting)
- [x] Build `SettingsModulesPage.tsx` (route `settings/modules`) reusing `ModulePicker` to change selection later
- [x] Mount `FarmSettingsProvider` in `App.tsx` (exists since Phase 10 but was never mounted) and filter `AppLayout.tsx` nav + `DashboardPage.tsx` cards by `enabledModuleIds`
- [x] Add `custom_options` table (farmId, listKey, value) + migration for farmer-added reference values
- [x] Add `packages/core/src/reference-data.ts` — default value lists for breed/species/variety/irrigation-type/soil-type fields across sheep, cattle-dairy, cattle-beef, goats, deer, pigs, poultry, bees, orchard, viticulture, microgreens, crop-planning/harvest-tracking, field-management/pasture, vegetables
- [x] Extend `FormFieldDef` (`module-adapter.ts`) with `optionsKey?: string`; convert the fields above in `registry.ts` from `type: "text"` to `type: "select"`
- [x] Build `useOptionsWithCustom` hook + `SelectWithCustom` component (default list + farm's custom additions, "+ Add new…" inline)
- [x] Wire `SelectWithCustom` into `ModulePage.tsx` for fields with `optionsKey`
- [x] Test: module picker filters nav/dashboard correctly; breed dropdown shows defaults + custom additions persist *(verified via typecheck + manual dev-server smoke test this session)*

## Phase 15 — Platform Modules ✅
> `packages/core/src/config/modules.ts` already defines 7 "platform" modules
> (financials, inventory, equipment, weather, compliance, staff, soil-water)
> with name/description/billing unit but zero schema/service/UI — placeholders
> for this phase. Prioritized order, each its own future plan:
- [x] **Financials** — income/expense ledger tagged by module/enterprise; input-price sheet (feed/chemical/seed cost per unit) and output-price sheet (wool/milk/produce price per unit); per-enterprise ROI view. Directly answers "pricing sheet for inputs and outputs."
- [x] **Soil & Water** — soil test records (pH, nutrient levels), nutrient budgets over time. Schema: `soil_tests` table. ModuleAdapter in `registry.ts`. Reference options for field selection.
- [x] **Inventory** — chemical/seed/feed/fertiliser stock levels + movements, low-stock alerts; feeds Decision Support. Schema: `inventory_items` + `inventory_movements` tables. ModuleAdapter shows items with reorder-level alerts surfaced in Decision Support.
- [x] **Weather spray-window calculator** — `WeatherPage.tsx` at `/modules/weather`. Fetches Open-Meteo 5-day hourly forecast; colour-codes each hour Good/Marginal/Poor based on wind (<15 kph), rain (<0.1 mm/h), humidity (<85%), temp (8–28°C). Shows best spray hour per day.
- [x] **Equipment** — asset register, maintenance log, WOF/COF reminders. Schema: `equipment_assets` table. ModuleAdapter with service/WoF/COF date tracking; overdue/due-soon alerts surface in Decision Support.
- [x] **Compliance** — regulatory checklist per country profile. Schema: `compliance_checks` table with PENDING/IN_PROGRESS/DONE/OVERDUE statuses. ModuleAdapter wired to `compliance-category` reference data.
- [x] **Staff** — roster/timesheets/contractor records. Schema: `staff_members` table with EMPLOYEE/CONTRACTOR/SEASONAL contract types. ModuleAdapter wired to `staff-role` reference data.
- [x] **Decision-support / "best strategy for the farm"** — `DecisionSupportPage.tsx` at `/modules/decision-support`. Rules-based advisory reading soil tests (pH < 5.5, low OM, low N), financials (negative 30-day cashflow), equipment (service/WoF/COF overdue or due within 30 days), inventory (stock at or below reorder level). Sorted high→medium→low priority. Added to MODULE_REGISTRY.

## Phase 16 — Bug Fixes (Platform Review, 2026-07-02) ✅
> Findings from a full platform review (bugs, TODOs, missing wiring, commercial-FMIS
> comparison). Review-only session, no code changed — items below turn the findings
> into tracked work. Priority order per the review's recommendation.
- [x] Fix backup export crash — envelope offset bug in `exportEncryptedBackup()` (`apps/desktop/src/backup/backup-service.ts`); `iv`/ciphertext written at wrong offsets, caused `Uint8Array.set()` to throw a `RangeError` on every call. New envelope format: version(1) + ivLen(1) + iv + ciphertext (dropped the vestigial `aadLen` byte per review's suggested fix).
- [x] Fix corresponding read side (`importEncryptedBackup`) to match the new 2-byte header.
- [x] Add `custom_options` **and** `ledger_entries`/`input_prices`/`output_prices` to the `allTables` list in `backup-service.ts` — `custom_options` was missing since migration `0004`; the three Financials tables were missing since Phase 15 added them without updating the backup list. All four verified round-tripping correctly.
- [x] Wrap `importEncryptedBackup()`'s restore in `db.transaction()` (drizzle's sqlite-proxy driver supports this natively via the existing `RemoteCallback` — no custom adapter plumbing needed).
- [x] ~~Add a `transaction()` helper to the shared DB adapter interface~~ — not needed; `db.transaction()` already works on both Tauri and Web adapters since both just implement the plain `RemoteCallback` signature that drizzle's built-in transaction support sends `begin`/`commit`/`rollback` through.
- [x] Clean up orphaned migration `0002_gigantic_masque.sql` — documented via SQL comment rather than squashed/deleted (rewriting migration history would break the journal for any environment that already applied it).
- [x] **Found while verifying the fix, not in original review** — `exportEncryptedBackup()`'s raw `SELECT *` queries returned positional arrays (no field metadata), so `importEncryptedBackup()`'s `Object.keys(rowObj)` produced numeric indices instead of real column names, meaning every restore INSERT silently failed (caught and swallowed) and **no restore had ever actually written a row back**. Fixed by mapping raw rows to column-keyed objects via `PRAGMA table_info` before storing them in the snapshot, and rewriting the restore INSERT to use parameterized `sql`/`sql.identifier` (the old `rawDb.run(sqlString, values)` call also silently dropped the `values` array — drizzle's raw `.run(query)` only accepts one argument).
- [x] **Found while verifying the fix, not in original review** — `apps/desktop/src/backup/bip39.ts`'s hand-rolled mnemonic encode/decode didn't round-trip correctly (256 bits doesn't divide evenly into 24×11-bit words without a checksum scheme), silently corrupting the last byte of the recovered key ~87.5% of the time and making recovery-phrase-based restore fail with "Decryption failed" for most phrases. Replaced with `@scure/bip39`'s audited `entropyToMnemonic`/`mnemonicToEntropy` (same package already used for the wordlist), keeping the existing exported function signatures so no call sites needed changes.
- [x] Verified end-to-end in a live browser session: seeded a farm + ledger entry + custom option + input/output prices, exported an encrypted backup, wiped every table, restored with the real recovery phrase, confirmed all data matches exactly.

## Phase 19b — UX Review Fixes: Buttons, Master Data, Dropdowns ✅
> User-reported: invisible ("white on white") buttons, and near-total absence of
> master/reference data — chemicals had no starter list, crop-planning tasks and
> staff assignment were free text instead of dropdowns, and ~68 other categorical
> fields across all 19 modules were free text where a searchable dropdown +
> "add custom" would serve farmers far better.
- [x] Root-cause the invisible-button bug: Tailwind v4's automatic content scanner only scans `apps/desktop/`, never sibling workspace package `packages/ui/src` — any utility class used only in `Button.tsx` (e.g. `bg-green-600`) was silently dropped from the compiled CSS, leaving a transparent background behind white text. Fixed with an explicit `@source "../../../packages/ui/src";` directive in `apps/desktop/src/index.css`. Also added `color-scheme: light` (defensive, for WebView2/Windows dark-mode native-control rendering) and fixed `Button.tsx`'s disabled-state contrast (blanket `disabled:opacity-50` was hardest on the already-low-contrast `ghost`/`secondary` variants).
- [x] Found and fixed a pre-existing React key warning: `ModulePage.tsx`'s table row `.map()` returned a shorthand `<>` Fragment with the `key` on the inner `<tr>` instead of the Fragment itself — fixed via `Fragment key={...}` from `react`.
- [x] Found and fixed a pre-existing rendering bug: column sort-arrow indicators (`▲▼`) were written as raw JSX text content instead of inside a `{}` expression, so JSX rendered the literal `▲▼` escape-code text instead of the arrow glyphs.
- [x] Build a real searchable `Combobox` component (`packages/ui/src/forms/Combobox.tsx`) — type-to-filter + keyboard nav + inline "+ Add" row — replacing the plain native `<select>` inside `SelectWithCustom`/`ForeignKeySelect`/`ModulePage`'s static-options branch everywhere.
- [x] Seed ~222 common agrichemicals (name + active ingredient only — no fabricated registration/withholding data) via `packages/core/src/chemical-seed-data.ts` + `seed-chemicals.ts`; auto-applied on farm setup when Pest & Spray Log is enabled, plus a manual "Load Standard Chemical List" button on the module page for existing farms.
- [x] Convert crop-planning `taskType`/`assignedTo` from free text to dropdowns (`optionsKey: "farm-task"` / staff `foreignKey`) — the headline ask.
- [x] Sweep ~68 categorical free-text fields across all 19 modules in `registry.ts` to `type: "select"` (`optionsKey` or staff `foreignKey`), each backed by a new sensibly-seeded `DEFAULT_OPTIONS` entry in `reference-data.ts` (grades, buyers, rootstocks, weather conditions, mortality causes, etc.) — left genuine identifiers (names, animal IDs, serial numbers) as free text.
- [x] Per user request mid-session, filled in generic starter values for previously-empty custom-only lists where a real generic default exists (equipment makes, storage locations, destinations, numbered zones) — left farm-unique things (buyer names, specific locations) empty for the farmer to populate.
- [x] Found and fixed: Staff (and Equipment/Compliance/Soil & Water/Inventory) had **no way to be enabled or discovered at all** — three-layer bug: (1) `ModulePicker.tsx` only rendered Horticulture/Livestock checkbox groups, no "platform" group; (2) 10 of 12 farm templates never included `"staff"` in their default module list; (3) `AppLayout.tsx`'s sidebar had a separate hardcoded `PLATFORM_NAV_LINKS` list missing 5 of 8 platform modules, so even an enabled module had no nav link. Fixed all three layers.
- [x] Learned/documented: `@tpt/core` resolves to compiled `dist/`, not live source (unlike `@tpt/ui`) — schema/reference-data edits need `pnpm --filter @tpt/core build` + a dev-server restart to take effect, easy to lose time to otherwise.
- [x] Verified end-to-end in a live headless-browser session (playwright-core driving a local Edge install): button visibility, Combobox search-and-select, chemical list loading, crop-planning dropdowns, staff-FK dropdowns, sidebar/dashboard nav completeness.

## Phase 20 — Comprehensive Farm Operations: Calendar, Compliance, Task Templates
> User feedback: the platform "still looks too simple for a farm management"
> system. Missing: whole-farm calendar, clearer treatment/withholding-period
> tracking against harvest readiness, fertiliser application tracking, equipment
> categorization, default tasks per crop/livestock type, crop rotation
> visibility, and a simpler/collapsible sidebar. Full plan: see `20260710`
> session plan file (button-fix session) — six ordered, mostly-independent
> sub-phases; later ones build on earlier foundations.
- [x] **20a — Compliance & field tracking**: auto-calculate spray withholding end dates from `applicationDate + chemical.withholdingPeriodDays`; warn-with-override on harvest-tracking entries for fields with an active withholding period; new fertiliser-application log (new `fertiliserApplications` table, tab under Soil & Water); equipment category filter-chip/group-by polish
- [x] **20b — Crop rotation visibility**: per-field planting-history modal (past seasons' variety/dates/status) — no plant-family logic, visibility only
- [x] **20c — Sidebar collapsible categories**: group nav links by `MODULE_REGISTRY` category with collapsible sections (localStorage-persisted), derive the nav list from the registry instead of a hand-maintained array (closes the class of bug fixed in Phase 19b)
- [x] **20d — Calendar aggregation foundation**: `dateFields` on `ModuleAdapter`, generic cross-module event scanner (`getFarmCalendarEvents`), trim `reminder-sources.ts` to just the derived (non-column) sources
- [x] **20e — General-purpose task-template engine**: new `taskTemplates` + `farmTasks` tables; migrate existing `planting_tasks` data into `farmTasks` and retire the old table/adapter; seed catalog + auto-trigger on crop-plan/livestock-group creation (dairy excluded — no herd-level entity); new "Tasks" and "Task Templates" modules/UI
- [x] **20f — Whole-farm calendar UI**: new `/calendar` route with a real month/day grid merging 20d+20e+trimmed reminder events; "+ Add Task" for ad hoc entries (transport/pickers); surface `farmTasks` in the existing notification bell/dashboard upcoming-events strip

## Phase 17 — Commercial FMIS Feature Gaps (flagged for prioritization, not yet scheduled)
> Gaps identified by comparing against commercial FMIS products (Figured, CashManager,
> Trev, FarmIQ) — not yet placed in the Phase 15 priority order, needs a decision from
> the user on sequencing. Per-country regulatory features should follow the existing
> `country-profiles.ts` pluggable pattern (like the weather provider registry and
> `regulatory.chemicalRegNumber` label overrides), not be hardcoded to one country.
- [x] Livestock traceability integration — legal requirement in many of the 10 supported country profiles (e.g. NAIT for NZ, NLIS for AU, similar schemes elsewhere); design as a per-country-profile pluggable integration (config entry + optional API adapter) rather than NZ-only, extending the same pattern used for weather providers
- [ ] Photo/media attachments on records — standard in every modern FMIS, absent from all 19 modules
- [x] Reporting/export — CSV/PDF farm report generation for accountant/bank use (beyond the existing narrow pest-spray-log PDF)
- [x] Notifications/reminders system — pluggable `ReminderSource` registry (`apps/desktop/src/notifications/reminder-sources.ts`) computing due-date alerts from existing data: spray withholding, sheep drenching meat withholding, planned harvests/plantings, pig weaning, bee hive inspections (21-day interval heuristic). Per-farm lead-time + mute-by-source config lives in `farms.settingsJson.notifications`, editable at `settings/notifications`. Surfaced via a bell icon + popover in `AppLayout` (overdue/due-soon/upcoming severity) and the dashboard's upcoming-events strip, both now driven by the same registry instead of duplicated queries. WOF/COF and low-stock alerts deferred — no Equipment/Inventory schema exists yet (Phase 15), so the registry has no data source for them; wiring is a 5-minute addition once those modules land.
- [ ] Accounting export integration — pluggable accounting-software connectors for the Financials module (start with Xero; design so other providers can be added later rather than hardcoding to Xero/MYOB)
- [x] Audit trail / change history on records — for compliance and dispute resolution
- [x] Analytics/KPI dashboards — trend charts (production over time, yield/ha by season), not just current-state tables
- [ ] GIS/mapping — paddock boundaries, satellite overlay for `field-management`
- [ ] Barcode/QR/RFID scanning — livestock tags and chemical/seed batch tracking, ties into NAIT integration

## Phase 18 — Wire Up Missing Transactional Record Sub-Tables ✅
> Full platform review (2026-07-03): every module adapter in `registry.ts` only
> wired up its "master" record (flock, herd, mob, hive, block, bed…). None of the
> ~35 child event/transaction tables already defined in `packages/core/src/schema/`
> (milk records, health events, drenching, shearing, lambing, spray events, feed
> records, mortality, egg records, honey harvests, hive inspections, weight
> records, harvest/planting detail records, climate/water-quality logs, etc.) had
> any UI — `reminder-sources.ts` already queried several of them
> (`sheepDrenchingRecords`, `beeInspections`, `sprayEvents`) expecting data the
> farmer had no way to enter. Biggest completeness gap found; fixed this session.
- [x] Add `foreignKey`/`boolean` support to `FormFieldDef` (`module-adapter.ts`) and a `ForeignKeySelect` component (`apps/desktop/src/components/ForeignKeySelect.tsx`) — dropdown of live parent records instead of a static reference list
- [x] Add `makeChildAdapter()` factory in `registry.ts` — farm-scopes a child table by joining its parent's `farmId`, builds the parent-picker form field automatically
- [x] Wire all ~30 child tables via the factory (dairy/beef/sheep/goat/deer/pig/poultry/bee/pasture records, crop-planning tasks, harvest records, viticulture/orchard/vegetable/microgreen/protected-cropping/aquaponics sub-records) plus two direct-farmId tables (`sprayEvents`, `pigFeedRecords`) as plain adapters
- [x] Add `MODULE_TAB_GROUPS` + tab bar in `ModulePage.tsx` — switches which adapter/table is shown on the same route (e.g. Sheep → Flocks / Lambing / Drenching / Shearing) without new nav entries or routes
- [x] Fix pre-existing bug found along the way — `vegetables.indoor`'s boolean-backed Yes/No `select` field wrote the literal string `"true"`/`"false"` into a `boolean`-mode SQLite column instead of a real boolean (both strings are truthy on read-back, so "No" silently became "Yes"); fixed via the new `boolean: true` flag + conversion in `ModulePage.tsx`'s `handleFormSubmit`
- [x] Run `pnpm typecheck` — all packages pass
- [ ] Test end-to-end in the dev server: for at least sheep, bees, and pest-spray-log, open the new tabs, create a record via the parent picker, and confirm the corresponding `reminder-sources.ts` alert (drenching/inspection/spray withholding) now actually fires

## Phase 19 — Reference Data Expansion + Usability ✅
> Same review: `DEFAULT_OPTIONS` existed but was thin and NZ/AU-biased despite 10
> supported country profiles, and several obvious categories (fertiliser, feed,
> treatment type, pasture species, units) were missing entirely.
- [x] Broaden existing breed/variety lists in `packages/core/src/reference-data.ts` (dairy/beef cattle, sheep, goats, deer, pigs, poultry, bee hive types) with commonly-used non-NZ/AU entries
- [x] Add new reference categories: `fertiliser-type`, `feed-type`, `treatment-type`, `pasture-species`, `unit-of-measure`, `movement-type`
- [x] Wire new categories into existing free-text fields: `pasture.grassType` → `pasture-species`; `input-prices`/`output-prices`/`inventory.unit` → `unit-of-measure`; new sub-table fields (`dairyHealthEvents.eventType` → `treatment-type`, `pigFeedRecords.feedType`/`aquaFeedingEvents.feedType` → `feed-type`, `vegSuccessions.cropVariety`/`aquaPlantYields.cropVariety` → `crop-variety`)
- [x] Usability: prefill date fields with today's date when opening the "+ Add" form (drenching, milking, spraying and similar day-to-day logging no longer needs the date re-picked every time)
- [x] Usability: reorder/filter reference-data dropdown options by the farm's active country profile instead of one flat global list
- [x] Usability: bulk entry — log the same event (drenching, weighing) against multiple animals/flocks in one submission
- [x] Usability: "setup completeness" nudge on the dashboard for empty reference-heavy modules (e.g. "no chemicals registered yet" on Pest & Spray Log), linking straight to the add form
- [x] Reference data: `fertiliser-type` has no natural field to attach to yet (no fertiliser-application schema) — revisit once/if a dedicated fertiliser-application record is added