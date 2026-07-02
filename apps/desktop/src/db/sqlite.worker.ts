// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
//
// Runs wa-sqlite + OriginPrivateFileSystemVFS. This MUST live in a dedicated
// Worker: OPFS's synchronous file access API (createSyncAccessHandle) is only
// available off the main thread per spec — calling it from adapter-web.ts
// directly throws "createSyncAccessHandle is not a function" on every read
// and write, silently breaking all persistence.
import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
// @ts-ignore - JS module without types
import { OriginPrivateFileSystemVFS } from "wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SQLiteAPI = any;

export interface SqliteRequest {
  id: number;
  sql: string;
  params: unknown[];
  method: "run" | "all" | "values" | "get";
}

export interface SqliteResponse {
  id: number;
  rows?: unknown;
  error?: string;
}

// Mirrors the Tauri migration list in `src-tauri/src/lib.rs` — the browser/OPFS
// path has no native migration runner, so migrations are applied manually here.
const migrationModules = import.meta.glob("../../../../packages/core/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const migrations = Object.entries(migrationModules)
  .map(([path, sql]) => ({ tag: path.split("/").pop()!.replace(/\.sql$/, ""), sql }))
  .sort((a, b) => a.tag.localeCompare(b.tag));

async function runMigrations(sqlite3: SQLiteAPI, db: number) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await sqlite3.exec(
    db,
    "CREATE TABLE IF NOT EXISTS __web_migrations (tag text PRIMARY KEY NOT NULL, applied_at integer NOT NULL)"
  );

  for (const { tag, sql } of migrations) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const result = await sqlite3.execWithParams(db, "SELECT 1 FROM __web_migrations WHERE tag = ?", [tag]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if ((result as { rows: unknown[][] }).rows.length > 0) continue;

    const statements = sql.split("--> statement-breakpoint");
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await sqlite3.exec(db, trimmed);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await sqlite3.execWithParams(db, "INSERT INTO __web_migrations (tag, applied_at) VALUES (?, ?)", [
      tag,
      Date.now(),
    ]);
  }
}

let ready: Promise<{ sqlite3: SQLiteAPI; db: number }> | null = null;

async function init() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const module = await SQLiteESMFactory();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const sqlite3: SQLiteAPI = (await import("wa-sqlite")).Factory(module);

  const vfs = new OriginPrivateFileSystemVFS();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  sqlite3.vfs_register(vfs, true);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const db: number = await sqlite3.open_v2("tpt-agriculture.db");
  // WAL requires shared-memory (xShm) semantics that OriginPrivateFileSystemVFS
  // doesn't persist across sessions — writes made under WAL mode were silently
  // lost on reload because the WAL frames never made it into the main OPFS
  // file. The default rollback journal writes straight to the main file, which
  // OPFS's synchronous access handle can persist reliably.

  await runMigrations(sqlite3, db);

  return { sqlite3, db };
}

async function handle(req: SqliteRequest): Promise<unknown> {
  ready ??= init();
  const { sqlite3, db } = await ready;

  if (req.method === "run") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await sqlite3.run(db, req.sql, req.params as any[]);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const result = await sqlite3.execWithParams(db, req.sql, req.params as any[]);

  if (req.method === "all" || req.method === "values") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (result as { rows: unknown[][] }).rows;
  }

  // method === "get"
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const { rows } = result as { rows: unknown[][] };
  return rows[0] ?? null;
}

// wa-sqlite's single connection can't service overlapping calls — many
// components (FarmContext, FarmSettingsContext, dashboard queries, ...) call
// getDb() concurrently on mount, so requests are queued and run one at a time
// instead of racing directly against `handle`.
let queue: Promise<unknown> = Promise.resolve();

self.onmessage = (event: MessageEvent<SqliteRequest>) => {
  const req = event.data;
  queue = queue.then(
    () => handle(req),
    () => handle(req)
  ).then(
    (rows) => {
      const response: SqliteResponse = { id: req.id, rows };
      (self as unknown as Worker).postMessage(response);
    },
    (error: unknown) => {
      const response: SqliteResponse = {
        id: req.id,
        error: error instanceof Error ? error.message : String(error),
      };
      (self as unknown as Worker).postMessage(response);
    }
  );
};
