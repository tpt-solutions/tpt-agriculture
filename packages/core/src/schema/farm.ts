import { integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { users } from "./identity.js";

export const farms = sqliteTable("farms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  countryProfile: text("country_profile").notNull().default("nz"),
  lat: real("lat"),
  lon: real("lon"),
  settingsJson: text("settings_json", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type FarmRole = "OWNER" | "ADMIN" | "MEMBER" | "READONLY";

export const farmUsers = sqliteTable(
  "farm_users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    farmId: text("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<FarmRole>().notNull().default("MEMBER"),
  },
  (t) => [unique().on(t.farmId, t.userId)]
);