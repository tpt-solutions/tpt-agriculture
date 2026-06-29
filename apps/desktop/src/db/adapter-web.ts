import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
// @ts-ignore - JS module without types
import { OriginPrivateFileSystemVFS } from "wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { RemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "@tpt/core/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SQLiteAPI = any;

let sqlite3Instance: SQLiteAPI | null = null;
let dbHandle: number | null = null;

async function getDb() {
  if (dbHandle !== null) return { sqlite3: sqlite3Instance!, db: dbHandle };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const module = await SQLiteESMFactory();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  sqlite3Instance = (await import("wa-sqlite")).Factory(module);

  const vfs = new OriginPrivateFileSystemVFS();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  sqlite3Instance.vfs_register(vfs, true);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  dbHandle = await sqlite3Instance.open_v2("tpt-agriculture.db");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  await sqlite3Instance.exec(dbHandle, "PRAGMA journal_mode = WAL");

  return { sqlite3: sqlite3Instance, db: dbHandle };
}

function rowsToObjects(rows: any[][], columns: string[]): any[] {
  return rows.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

const callback: RemoteCallback = async (sql, params, method) => {
  const { sqlite3, db } = await getDb();

  if (method === "run") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await sqlite3.run(db, sql, params as any[]);
    return { rows: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const result = await sqlite3.execWithParams(db, sql, params as any[]);

  if (method === "all") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-destructuring, @typescript-eslint/no-unsafe-member-access
    const { rows, columns } = result as { rows: any[][]; columns: string[] };
    return { rows: rowsToObjects(rows, columns) };
  }

  if (method === "get") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-destructuring, @typescript-eslint/no-unsafe-member-access
    const { rows, columns } = result as { rows: any[][]; columns: string[] };
    if (rows.length === 0) return { rows: [] };
    return { rows: rowsToObjects(rows.slice(0, 1), columns) };
  }

  if (method === "values") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return { rows: (result as { rows: any[][] }).rows };
  }

  return { rows: [] };
};

export const tptDb = drizzle(callback, { schema });
