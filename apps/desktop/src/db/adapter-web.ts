// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { RemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "@tpt/core/schema";
import type { SqliteRequest, SqliteResponse } from "./sqlite.worker.js";

// wa-sqlite's OPFS VFS must run inside a dedicated Worker — OPFS's synchronous
// file access API is only available off the main thread per spec.
const worker = new Worker(new URL("./sqlite.worker.js", import.meta.url), { type: "module" });

let nextId = 0;
const pending = new Map<number, { resolve: (rows: unknown) => void; reject: (err: Error) => void }>();

worker.onmessage = (event: MessageEvent<SqliteResponse>) => {
  const { id, rows, error } = event.data;
  const entry = pending.get(id);
  if (!entry) return;
  pending.delete(id);
  if (error) entry.reject(new Error(error));
  else entry.resolve(rows);
};

worker.onerror = (event: ErrorEvent) => {
  for (const [, entry] of pending) entry.reject(new Error(event.message));
  pending.clear();
};

function call(sql: string, params: unknown[], method: SqliteRequest["method"]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, sql, params, method } satisfies SqliteRequest);
  });
}

const callback: RemoteCallback = async (sql, params, method) => {
  const rows = await call(sql, params, method);

  if (method === "run") return { rows: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (method === "get") return { rows: rows as any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { rows: (rows ?? []) as any };
};

export const tptDb = drizzle(callback, { schema });
