import type { DrizzleDb } from "./db-types.js";

let _db: DrizzleDb | null = null;

export function setDb(database: DrizzleDb) {
  _db = database;
}

export function getDb(): DrizzleDb {
  if (!_db) throw new Error("Database not initialized. Call setDb() first.");
  return _db;
}
