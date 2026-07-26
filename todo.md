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
- [x] **Equipment** — asset register, maintenance log, WOF/COF reminders. Schema: `equipment_assets` table. ModuleAdapter with service/WoF/CoF date tracking; overdue/due-soon alerts surface in Decision Support.
- [x] **Compliance** — regulatory checklist per country profile. Schema: `compliance_checks` table with PENDING/IN_PROGRESS/DONE/OVERDUE statuses. ModuleAdapter wired to `compliance-category` reference data.
- [x] **Staff** — roster/timesheets/contractor records. Schema: `staff_members` table with EMPLOYEE/CONTRACTOR/SEASONAL contract types. ModuleAdapter wired to `staff-role` reference data.
- [x] **Decision-support / "best strategy for the farm"** — `DecisionSupportPage.tsx` at `/modules/decision-support`. Rules-based advisory reading soil tests (pH < 5.5, low OM, low N), financials (negative 30-day cashflow), equipment (service/WoF/CoF overdue or due within 30 days), inventory (stock at or below reorder level). Sorted high→medium→low priority. Added to MODULE_REGISTRY.

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

## Phase 17 — Commercial FMIS Feature Gaps (flagged for prioritization, not yet scheduled)
> Gaps identified by comparing against commercial FMIS products (Figured, CashManager,
> Trev, FarmIQ) — not yet placed in the Phase 15 priority order, needs a decision from
> the user on sequencing. Per-country regulatory features should follow the existing
> `country-profiles.ts` pluggable pattern (like the weather provider registry and
> `regulatory.chemicalRegNumber` label overrides), not be hardcoded to one country.
- [x] Livestock traceability integration — new `livestock_movements` table (farm-scoped, direct like `sprayEvents`) recording onto/off-property movements (date, species, direction, head count, tag numbers, counterparty, reference). Pluggable per-country scheme: `packages/core/src/config/traceability-schemes.ts` defines `TRACEABILITY_SCHEMES` (`nait`, `nlis`, `generic`) with per-scheme display name + tag terminology; `CountryProfile.regulatory.traceabilityScheme` points each of the 10 country profiles at one (nz→nait, au→nlis, rest→generic pending real scheme data), mirroring the `weatherProviders` registry pattern. `scheme` is resolved server-side from the farm's country profile at record-creation time (not a user-facing field) so historical records keep their original scheme even if the farm's profile changes later. Tag-number field/column label is dynamically relabeled per scheme (e.g. "NAIT Number") the same way `pest-spray-log`'s registration-number label already keys off `chemicalRegNumber`. New platform module `livestock-traceability` (module registry + Dashboard card + sidebar link), species limited to the 7 individually-tagged livestock modules (excludes bees/pasture). Added `livestock_movements` to `backup-service.ts`'s `allTables` list immediately (the exact miss Phase 16 fixed for four other tables). No real NAIT/NLIS API sync yet — same "registry exists, only one provider actually wired up" state as `WEATHER_PROVIDERS` (bom/met-office/noaa are listed but unimplemented); that's the natural next step once a specific scheme's API is prioritized. **Found while implementing, not fixed (out of scope for this item)**: `AppLayout.tsx`'s sidebar `PLATFORM_NAV_LINKS` was already missing 5 pre-existing platform modules (soil-water, inventory, equipment, compliance, staff) — they're only reachable via Dashboard cards, not the sidebar. Worth a follow-up cleanup pass.
- [x] Photo/media attachments on records — new `attachments` table (farm-scoped, generic `recordTable`/`recordId` pair so any module's record can attach files without a per-module schema). `apps/desktop/src/attachments/attachments-service.ts` for CRUD; `apps/desktop/src/utils/image-resize.ts` downscales images client-side to max 1600px JPEG@0.8 before base64-encoding into SQLite (raw phone photos would otherwise bloat the DB and backup export); non-image files (PDF) pass through capped at 10 MB. `AttachmentsPanel.tsx` is a generic modal (upload + gallery + delete) wired into every module's table row in `ModulePage.tsx` via a 📎 button showing a live attachment count per record (`countAttachments`, invalidated on upload/delete). Added `attachments` to `backup-service.ts`'s `allTables` list immediately (the Phase 16 miss). `pnpm typecheck` passes across all packages.
- [x] Reporting/export — new `/modules/reports` page (`apps/desktop/src/pages/ReportsPage.tsx`, static route + sidebar link + Dashboard card, same pattern as Weather/Decision Support). Two sections: (1) **Financial Summary** — date-range query over `ledger_entries`, shows income/expense/profit totals plus a per-enterprise (moduleId) breakdown table, exportable as CSV or PDF; (2) **Module Data Export** — pick any of the 30 registered modules and export its full record list as CSV via the existing `MODULE_ADAPTERS` registry (`adapter.list()` + `adapter.columns`), so every module gets an export for free without per-module code. Generalized the old pest-spray-log-only `generateChemicalRegisterPdf` in `pdf-export.ts` into a reusable `generateTablePdf(title, subtitle, columns, rows)`, with the chemical register now a thin wrapper around it. Added a new generic `apps/desktop/src/utils/csv-export.ts` (`rowsToCsv`/`downloadCsv`, UTF-8 BOM for Excel compatibility) — first CSV export capability in the codebase. `pnpm typecheck` passes across all packages; dev server verified serving the new route.
- [x] Notifications/reminders system — pluggable `ReminderSource` registry (`apps/desktop/src/notifications/reminder-sources.ts`) computing due-date alerts from existing data: spray withholding, sheep drenching meat withholding, planned harvests/plantings, pig weaning, bee hive inspections (21-day interval heuristic). Per-farm lead-time + mute-by-source config lives in `farms.settingsJson.notifications`, editable at `settings/notifications`. Surfaced via a bell icon + popover in `AppLayout` (overdue/due-soon/upcoming severity) and the dashboard's upcoming-events strip, both now driven by the same registry instead of duplicated queries. WOF/COF and low-stock alerts deferred — no Equipment/Inventory schema exists yet (Phase 15), so the registry has no data source for them; wiring is a 5-minute addition once those modules land.
- [x] Accounting export integration — pluggable accounting-software connectors for the Financials module (start with Xero; design so other providers can be added later rather than hardcoding to Xero/MYOB) — `AccountingConnector` interface + Xero CSV manual-journal export + MYOB stub added in `apps/desktop/src/accounting/`; wired into Reports page.
- [x] Audit trail / change history on records — for compliance and dispute resolution — `writeAuditLog` called from every CRUD hook in `use-module-query.ts`; `AuditLogPanel` renders in `ModulePage.tsx` via 🕘 button per row.
- [x] Analytics/KPI dashboards — trend charts (production over time, yield/ha by season), not just current-state tables — `AnalyticsPage.tsx` with financial, milk, harvest, lambing, egg, honey trend charts + KPI cards; lightweight SVG `BarChart`/`LineChart` in `Charts.tsx`.
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

## Phase 19 — Reference Data Expansion + Usability ✅ (partial)
> Same review: `DEFAULT_OPTIONS` existed but was thin and NZ/AU-biased despite 10
> supported country profiles, and several obvious categories (fertiliser, feed,
> treatment type, pasture species, units) were missing entirely.
- [x] Broaden existing breed/variety lists in `packages/core/src/reference-data.ts` (dairy/beef cattle, sheep, goats, deer, pigs, poultry, bee hive types) with commonly-used non-NZ/AU entries
- [x] Add new reference categories: `fertiliser-type`, `feed-type`, `treatment-type`, `pasture-species`, `unit-of-measure`, `movement-type`
- [x] Wire new categories into existing free-text fields: `pasture.grassType` → `pasture-species`; `input-prices`/`output-prices`/`inventory.unit` → `unit-of-measure`; new sub-table fields (`dairyHealthEvents.eventType` → `treatment-type`, `pigFeedRecords.feedType`/`aquaFeedingEvents.feedType` → `feed-type`, `vegSuccessions.cropVariety`/`aquaPlantYields.cropVariety` → `crop-variety`)
- [x] Usability: prefill date fields with today's date when opening the "+ Add" form (drenching, milking, spraying and similar day-to-day logging no longer needs the date re-picked every time)
- [ ] Usability: reorder/filter reference-data dropdown options by the farm's active country profile instead of one flat global list *(deferred — needs design decision on country-priority mapping)*
- [x] Usability: bulk entry — log the same event (drenching, weighing) against multiple animals/flocks in one submission — `BulkEntryPanel.tsx` added, wired into `ModulePage.tsx` for any child adapter with a `foreignKey` field.
- [x] Usability: "setup completeness" nudge on the dashboard for empty reference-heavy modules (e.g. "no chemicals registered yet" on Pest & Spray Log), linking straight to the add form — zero-record horticulture/livestock dashboard cards now show "Get started — add your first record →" prompt.
- [x] Reference data: `fertiliser-type` has no natural field to attach to yet (no fertiliser-application schema) — revisit once/if a dedicated fertiliser-application record is added — `fertiliser_applications` table + ModuleAdapter + dashboard card + sidebar link added; `fertiliser-type` wired in.