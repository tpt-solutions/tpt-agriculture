// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { farms } from "./farm.js";

// ─── Audit Trail / Change History ──────────────────────────────────────────────

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  operation: text("operation").notNull(), // INSERT, UPDATE, DELETE
  changedBy: text("changed_by"), // User identifier (if available)
  changedAt: integer("changed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  oldValues: text("old_values", { mode: "json" }).$type<Record<string, unknown> | null>(),
  newValues: text("new_values", { mode: "json" }).$type<Record<string, unknown> | null>(),
  notes: text("notes"),
});

// Indexes for efficient querying
// audit_log_farm_idx: index on farmId
// audit_log_table_record_idx: index on tableName, recordId
// audit_log_date_idx: index on changedAt