import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
