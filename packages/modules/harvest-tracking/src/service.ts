import { eq, and, asc, desc, gte, lte } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { harvestBatches, harvestRecords, fields, plots } from "@tpt/core/schema";
import type { CreateHarvestBatchInput, UpdateHarvestBatchInput, CreateHarvestRecordInput, UpdateHarvestRecordInput } from "./schemas.js";

export async function listHarvestBatches(farmId: string) {
  const db = getDb();
  return db.select().from(harvestBatches).where(eq(harvestBatches.farmId, farmId)).orderBy(desc(harvestBatches.harvestDate));
}

export async function getHarvestBatch(farmId: string, batchId: string) {
  const db = getDb();
  const [batch] = await db.select().from(harvestBatches)
    .where(and(eq(harvestBatches.id, batchId), eq(harvestBatches.farmId, farmId)))
    .limit(1);
  if (!batch) return null;
  const records = await db.select().from(harvestRecords).where(eq(harvestRecords.batchId, batchId));
  return { ...batch, records };
}

export async function createHarvestBatch(farmId: string, data: CreateHarvestBatchInput) {
  const db = getDb();
  const [row] = await db.insert(harvestBatches).values({ ...data, farmId }).returning();
  return row;
}

export async function updateHarvestBatch(farmId: string, batchId: string, data: UpdateHarvestBatchInput) {
  const db = getDb();
  const [row] = await db.update(harvestBatches).set(data)
    .where(and(eq(harvestBatches.id, batchId), eq(harvestBatches.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteHarvestBatch(farmId: string, batchId: string) {
  const db = getDb();
  await db.delete(harvestBatches).where(and(eq(harvestBatches.id, batchId), eq(harvestBatches.farmId, farmId)));
}

export async function createHarvestRecord(data: CreateHarvestRecordInput) {
  const db = getDb();
  const [row] = await db.insert(harvestRecords).values(data).returning();
  return row;
}

export async function updateHarvestRecord(recordId: string, data: UpdateHarvestRecordInput) {
  const db = getDb();
  const [row] = await db.update(harvestRecords).set(data).where(eq(harvestRecords.id, recordId)).returning();
  return row;
}

export async function deleteHarvestRecord(recordId: string) {
  const db = getDb();
  await db.delete(harvestRecords).where(eq(harvestRecords.id, recordId));
}
