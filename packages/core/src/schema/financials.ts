import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { farms } from "./farm.js";

// ─── Ledger ─────────────────────────────────────────────────────────────────

export const ledgerEntries = sqliteTable("ledger_entries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "INCOME" | "EXPENSE"
  date: integer("date", { mode: "timestamp" }).notNull(),
  amount: real("amount").notNull(),
  category: text("category"),
  moduleId: text("module_id"), // enterprise tag, matches a MODULE_REGISTRY key
  description: text("description"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Input Prices (feed/chemical/seed cost per unit) ───────────────────────

export const inputPrices = sqliteTable("input_prices", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  itemName: text("item_name").notNull(),
  category: text("category"),
  unit: text("unit"),
  costPerUnit: real("cost_per_unit").notNull(),
  effectiveDate: integer("effective_date", { mode: "timestamp" }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Output Prices (wool/milk/produce price per unit) ──────────────────────

export const outputPrices = sqliteTable("output_prices", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  itemName: text("item_name").notNull(),
  category: text("category"),
  unit: text("unit"),
  pricePerUnit: real("price_per_unit").notNull(),
  effectiveDate: integer("effective_date", { mode: "timestamp" }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
