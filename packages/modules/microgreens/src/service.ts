import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { microgreenBatches, microgreenTrays } from "@tpt/core/schema";
import type { CreateMicrogreenBatchInput, UpdateMicrogreenBatchInput, CreateMicrogreenTrayInput, UpdateMicrogreenTrayInput } from "./schemas.js";

export async function listBatches(farmId: string) {
  const db = getDb();
  return db.select().from(microgreenBatches).where(eq(microgreenBatches.farmId, farmId)).orderBy(desc(microgreenBatches.seedingDate));
}

export async function getBatch(farmId: string, batchId: string) {
  const db = getDb();
  const [batch] = await db.select().from(microgreenBatches)
    .where(and(eq(microgreenBatches.id, batchId), eq(microgreenBatches.farmId, farmId)))
    .limit(1);
  if (!batch) return null;
  const trays = await db.select().from(microgreenTrays).where(eq(microgreenTrays.batchId, batchId)).orderBy(asc(microgreenTrays.trayNumber));
  return { ...batch, trays };
}

export async function createBatch(farmId: string, data: CreateMicrogreenBatchInput) {
  const db = getDb();
  const [row] = await db.insert(microgreenBatches).values({ ...data, farmId }).returning();
  return row;
}

export async function updateBatch(farmId: string, batchId: string, data: UpdateMicrogreenBatchInput) {
  const db = getDb();
  const [row] = await db.update(microgreenBatches).set(data)
    .where(and(eq(microgreenBatches.id, batchId), eq(microgreenBatches.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteBatch(farmId: string, batchId: string) {
  const db = getDb();
  await db.delete(microgreenBatches).where(and(eq(microgreenBatches.id, batchId), eq(microgreenBatches.farmId, farmId)));
}

export async function createTray(data: CreateMicrogreenTrayInput) {
  const db = getDb();
  const [row] = await db.insert(microgreenTrays).values(data).returning();
  return row;
}

export async function updateTray(trayId: string, data: UpdateMicrogreenTrayInput) {
  const db = getDb();
  const [row] = await db.update(microgreenTrays).set(data).where(eq(microgreenTrays.id, trayId)).returning();
  return row;
}

export async function deleteTray(trayId: string) {
  const db = getDb();
  await db.delete(microgreenTrays).where(eq(microgreenTrays.id, trayId));
}
