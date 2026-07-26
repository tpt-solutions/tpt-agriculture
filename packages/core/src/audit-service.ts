// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { getDb } from "./db.js";
import { auditLog } from "./schema/audit.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface AuditEntry {
  id: string;
  tableName: string;
  recordId: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  changedBy: string | undefined;
  changedAt: Date;
  oldValues: Record<string, unknown> | null | undefined;
  newValues: Record<string, unknown> | null | undefined;
  notes: string | undefined;
}

export interface AuditQueryOptions {
  tableName?: string;
  recordId?: string;
  operation?: "INSERT" | "UPDATE" | "DELETE";
  changedBy?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

export async function logChange(
  farmId: string,
  tableName: string,
  recordId: string,
  operation: "INSERT" | "UPDATE" | "DELETE",
  data: {
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    changedBy?: string;
    notes?: string;
  },
): Promise<void> {
  const db = await getDb();
  await db.insert(auditLog).values({
    farmId,
    tableName,
    recordId,
    operation,
    changedBy: data.changedBy,
    oldValues: data.oldValues,
    newValues: data.newValues,
    notes: data.notes,
  });
}

export async function getAuditLog(
  farmId: string,
  options: AuditQueryOptions = {},
): Promise<AuditEntry[]> {
  const db = await getDb();
  const conditions = [eq(auditLog.farmId, farmId)];

  if (options.tableName) {
    conditions.push(eq(auditLog.tableName, options.tableName));
  }
  if (options.recordId) {
    conditions.push(eq(auditLog.recordId, options.recordId));
  }
  if (options.operation) {
    conditions.push(eq(auditLog.operation, options.operation));
  }
  if (options.changedBy) {
    conditions.push(eq(auditLog.changedBy, options.changedBy));
  }
  if (options.fromDate) {
    conditions.push(gte(auditLog.changedAt, options.fromDate));
  }
  if (options.toDate) {
    conditions.push(lte(auditLog.changedAt, options.toDate));
  }

  const rows = await db
    .select()
    .from(auditLog)
    .where(and(...conditions))
    .orderBy(desc(auditLog.changedAt))
    .limit(options.limit ?? 100);

  return rows.map((r) => ({
    id: r.id,
    tableName: r.tableName,
    recordId: r.recordId,
    operation: r.operation as "INSERT" | "UPDATE" | "DELETE",
    changedBy: r.changedBy ?? undefined,
    changedAt: r.changedAt,
    oldValues: r.oldValues,
    newValues: r.newValues,
    notes: r.notes ?? undefined,
  }));
}

// Helper to get change history for a specific record
export async function getRecordHistory(
  farmId: string,
  tableName: string,
  recordId: string,
): Promise<AuditEntry[]> {
  return getAuditLog(farmId, { tableName, recordId });
}