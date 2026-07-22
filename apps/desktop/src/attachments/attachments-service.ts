// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { attachments } from "@tpt/core/schema";
import type { ProcessedFile } from "../utils/image-resize.js";

export async function listAttachments(farmId: string, recordTable: string, recordId: string) {
  const db = await getDb();
  return db
    .select()
    .from(attachments)
    .where(and(eq(attachments.farmId, farmId), eq(attachments.recordTable, recordTable), eq(attachments.recordId, recordId)))
    .orderBy(desc(attachments.createdAt));
}

export async function createAttachment(
  farmId: string,
  recordTable: string,
  recordId: string,
  file: ProcessedFile,
  caption?: string
) {
  const db = await getDb();
  const [row] = await db
    .insert(attachments)
    .values({ farmId, recordTable, recordId, caption, ...file })
    .returning();
  return row;
}

export async function deleteAttachment(farmId: string, id: string) {
  const db = await getDb();
  await db.delete(attachments).where(and(eq(attachments.id, id), eq(attachments.farmId, farmId)));
}

export async function countAttachments(farmId: string, recordTable: string, recordIds: string[]): Promise<Record<string, number>> {
  if (recordIds.length === 0) return {};
  const rows = await listAttachmentsForTable(farmId, recordTable);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.recordId] = (counts[row.recordId] ?? 0) + 1;
  }
  return counts;
}

async function listAttachmentsForTable(farmId: string, recordTable: string) {
  const db = await getDb();
  return db
    .select({ recordId: attachments.recordId })
    .from(attachments)
    .where(and(eq(attachments.farmId, farmId), eq(attachments.recordTable, recordTable)));
}
