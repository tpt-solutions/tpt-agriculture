// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { RemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "@tpt/core/schema";

const DB_PATH = "sqlite:tpt-agriculture.db";

let tauriDb: Database | null = null;

async function getTauriDb(): Promise<Database> {
  if (!tauriDb) {
    tauriDb = await Database.load(DB_PATH);
  }
  return tauriDb;
}

const callback: RemoteCallback = async (sql, params, method) => {
  const db = await getTauriDb();

  if (method === "all") {
    const rows = await db.select(sql, params);
    return { rows: rows as any[] };
  }

  if (method === "get") {
    const rows = await db.select(sql, params);
    return { rows: (rows as any[])[0] ?? null };
  }

  if (method === "values") {
    const rows = await db.select(sql, params);
    return { rows: (rows as any[]).map((r) => Object.values(r)) };
  }

  await db.execute(sql, params);
  return { rows: [] };
};

export const tptDb = drizzle(callback, { schema });

