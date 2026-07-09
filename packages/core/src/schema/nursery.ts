// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { farms } from "./farm.js";

export const nurseryBeds = sqliteTable("nursery_beds", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bedType: text("bed_type").notNull(),
  areaSqm: real("area_sqm"),
  capacity: integer("capacity"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const nurseryPropagation = sqliteTable("nursery_propagation", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bedId: text("bed_id").notNull().references(() => nurseryBeds.id, { onDelete: "cascade" }),
  species: text("species").notNull(),
  variety: text("variety"),
  seededDate: integer("seeded_date", { mode: "timestamp" }).notNull(),
  trayCount: integer("tray_count").notNull(),
  cellsPerTray: integer("cells_per_tray"),
  germinationPct: real("germination_pct"),
  expectedReadyDate: integer("expected_ready_date", { mode: "timestamp" }),
  status: text("status").notNull().default("GERMINATING"),
  notes: text("notes"),
});

export const nurseryTransplants = sqliteTable("nursery_transplants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propagationId: text("propagation_id").notNull().references(() => nurseryPropagation.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  plantCount: integer("plant_count").notNull(),
  destination: text("destination"),
  buyer: text("buyer"),
  pricePerPlant: real("price_per_plant"),
  notes: text("notes"),
});
