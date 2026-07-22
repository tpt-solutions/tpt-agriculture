// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { auditLog } from "@tpt/core/schema";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuditDiff {
  field: string;
  before: unknown;
  after: unknown;
}

const IGNORED_FIELDS = new Set(["id", "farmId", "createdAt", "updatedAt"]);

/** Records a change to the generic `audit_log` table. Called from the single
 * choke point in `use-module-query.ts` so every module's CRUD is covered
 * without touching each of the ~60 individual adapters. */
export async function writeAuditLog(
  farmId: string,
  tableName: string,
  recordId: string,
  action: AuditAction,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): Promise<void> {
  let changes: unknown = null;
  if (action === "UPDATE" && before && after) {
    const diffs: AuditDiff[] = [];
    for (const key of Object.keys(after)) {
      if (IGNORED_FIELDS.has(key)) continue;
      const beforeVal = before[key];
      const afterVal = after[key];
      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        diffs.push({ field: key, before: beforeVal, after: afterVal });
      }
    }
    if (diffs.length === 0) return;
    changes = diffs;
  } else if (action === "CREATE") {
    changes = after;
  } else if (action === "DELETE") {
    changes = before;
  }

  const db = await getDb();
  await db.insert(auditLog).values({
    farmId,
    tableName,
    recordId,
    action,
    changes: JSON.stringify(changes),
  });
}

export async function listAuditLog(farmId: string, tableName: string, recordId: string) {
  const db = await getDb();
  return db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.farmId, farmId), eq(auditLog.tableName, tableName), eq(auditLog.recordId, recordId)))
    .orderBy(desc(auditLog.createdAt));
}
