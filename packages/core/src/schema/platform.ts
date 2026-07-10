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

// ─── Task Templates & Farm Tasks ──────────────────────────────────────────────

export const taskTemplates = sqliteTable("task_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  taskType: text("task_type").notNull(),
  defaultDueDaysOffset: integer("default_due_days_offset"), // days after trigger event
  defaultAssignedRole: text("default_assigned_role"),
  category: text("category"), // crop-plan, livestock, equipment, general
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const farmTasks = sqliteTable("farm_tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  templateId: text("template_id").references(() => taskTemplates.id, { onDelete: "set null" }),
  taskType: text("task_type").notNull(),
  title: text("title"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  assignedTo: text("assigned_to"),
  status: text("status").notNull().default("PENDING"), // PENDING, IN_PROGRESS, DONE, OVERDUE
  sourceModule: text("source_module"), // which module triggered this task
  sourceId: text("source_id"), // ID of the triggering record
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
