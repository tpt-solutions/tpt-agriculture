import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import type * as schema from "./schema/index.js";

export type TptSchema = typeof schema;
export type DrizzleDb = SqliteRemoteDatabase<TptSchema>;
