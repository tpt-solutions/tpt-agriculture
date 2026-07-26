// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { farms } from "./farm.js";

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  moduleId: text("module_id").notNull(),
  recordId: text("record_id").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
