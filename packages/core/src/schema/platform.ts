// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { farms } from "./farm.js";

// ─── Soil & Water ────────────────────────────────────────────────────────────

export const soilTests = sqliteTable("soil_tests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  testDate: integer("test_date", { mode: "timestamp" }).notNull(),
  fieldName: text("field_name"),
  pH: real("ph"),
  phosphorusKgHa: real("phosphorus_kg_ha"),
  potassiumKgHa: real("potassium_kg_ha"),
  nitrogenKgHa: real("nitrogen_kg_ha"),
  organicMatterPct: real("organic_matter_pct"),
  calciumKgHa: real("calcium_kg_ha"),
  sulphurKgHa: real("sulphur_kg_ha"),
  labReference: text("lab_reference"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Inventory ───────────────────────────────────────────────────────────────

export const inventoryItems = sqliteTable("inventory_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  itemName: text("item_name").notNull(),
  category: text("category"), // chemical, seed, feed, fertiliser
  unit: text("unit"),
  currentStock: real("current_stock").notNull().default(0),
  reorderLevel: real("reorder_level"),
  location: text("location"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  movementType: text("movement_type").notNull(), // IN, OUT, ADJUST
  quantity: real("quantity").notNull(),
  movementDate: integer("movement_date", { mode: "timestamp" }).notNull(),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Equipment ───────────────────────────────────────────────────────────────

export const equipmentAssets = sqliteTable("equipment_assets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  assetType: text("asset_type"),
  make: text("make"),
  model: text("model"),
  serialNumber: text("serial_number"),
  purchaseDate: integer("purchase_date", { mode: "timestamp" }),
  purchasePrice: real("purchase_price"),
  lastServiceDate: integer("last_service_date", { mode: "timestamp" }),
  nextServiceDate: integer("next_service_date", { mode: "timestamp" }),
  wofExpiry: integer("wof_expiry", { mode: "timestamp" }),
  cofExpiry: integer("cof_expiry", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Compliance ──────────────────────────────────────────────────────────────

export const complianceChecks = sqliteTable("compliance_checks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  checkName: text("check_name").notNull(),
  category: text("category"),
  countryProfile: text("country_profile"),
  status: text("status").notNull().default("PENDING"), // PENDING, IN_PROGRESS, DONE, OVERDUE
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Staff ───────────────────────────────────────────────────────────────────

export const staffMembers = sqliteTable("staff_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  contractType: text("contract_type"), // EMPLOYEE, CONTRACTOR, SEASONAL
  phone: text("phone"),
  email: text("email"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Attachments ─────────────────────────────────────────────────────────────
// Generic photo/media attachment, reusable across every module's records rather
// than adding a bespoke table per module. `recordTable` + `recordId` point at the
// owning row (e.g. "sheep_flocks" / a flock's id). Stored as a base64 blob in the
// same SQLite database used for everything else, since the DB adapter is the only
// storage abstraction shared between the Tauri (plugin-sql) and PWA (OPFS)
// backends — a filesystem path would only work on desktop.

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  recordTable: text("record_table").notNull(),
  recordId: text("record_id").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  dataBase64: text("data_base64").notNull(),
  caption: text("caption"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Fertiliser Applications ──────────────────────────────────────────────────

export const fertiliserApplications = sqliteTable("fertiliser_applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  applicationDate: integer("application_date", { mode: "timestamp" }).notNull(),
  fieldName: text("field_name"),
  fertiliserType: text("fertiliser_type"),
  ratePerHa: real("rate_per_ha"),
  totalQuantity: real("total_quantity"),
  unit: text("unit"),
  cost: real("cost"),
  operator: text("operator"),
  method: text("method"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Audit Log ───────────────────────────────────────────────────────────────
// Generic change-history log, written from a single choke point (the module
// CRUD mutation hooks in `use-module-query.ts`) rather than per-adapter, so it
// covers every module's record automatically. `changes` is a JSON string: an
// array of `{ field, before, after }` diffs for UPDATE, or a full row snapshot
// for CREATE/DELETE. No `actorId` yet — the app has no user/session concept
// (auth is not implemented despite CLAUDE.md's aspirational description), so
// this only captures *what* changed and *when*, not *who* changed it.

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  action: text("action").notNull(), // "CREATE" | "UPDATE" | "DELETE"
  changes: text("changes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
