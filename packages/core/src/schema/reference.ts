import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { farms } from "./farm.js";

export const customOptions = sqliteTable(
  "custom_options",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    farmId: text("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    listKey: text("list_key").notNull(),
    value: text("value").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [unique().on(t.farmId, t.listKey, t.value)]
);
