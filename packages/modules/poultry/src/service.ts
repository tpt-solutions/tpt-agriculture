import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { poultryFlocks, poultryEggRecords, poultryMortality } from "@tpt/core/schema";

export async function listFlocks(farmId: string) {
  const db = getDb();
  return db.select().from(poultryFlocks).where(eq(poultryFlocks.farmId, farmId)).orderBy(asc(poultryFlocks.batchName));
}

export async function getFlock(farmId: string, flockId: string) {
  const db = getDb();
  const [flock] = await db.select().from(poultryFlocks)
    .where(and(eq(poultryFlocks.id, flockId), eq(poultryFlocks.farmId, farmId)))
    .limit(1);
  if (!flock) return null;
  const eggs = await db.select().from(poultryEggRecords).where(eq(poultryEggRecords.flockId, flockId)).orderBy(desc(poultryEggRecords.date)).limit(30);
  const mortality = await db.select().from(poultryMortality).where(eq(poultryMortality.flockId, flockId)).orderBy(desc(poultryMortality.date));
  return { ...flock, eggRecords: eggs, mortalityRecords: mortality };
}

export async function createFlock(farmId: string, data: { batchName: string; species: string; breed?: string | null; birdCount: number; housedDate: Date; purpose: string }) {
  const db = getDb();
  const [row] = await db.insert(poultryFlocks).values({ ...data, farmId }).returning();
  return row;
}

export async function updateFlock(farmId: string, flockId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(poultryFlocks).set(data)
    .where(and(eq(poultryFlocks.id, flockId), eq(poultryFlocks.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteFlock(farmId: string, flockId: string) {
  const db = getDb();
  await db.delete(poultryFlocks).where(and(eq(poultryFlocks.id, flockId), eq(poultryFlocks.farmId, farmId)));
}

export async function createEggRecord(data: { flockId: string; date: Date; eggCount: number; grade?: string; cracked?: number }) {
  const db = getDb();
  const [row] = await db.insert(poultryEggRecords).values(data).returning();
  return row;
}

export async function deleteEggRecord(recordId: string) {
  const db = getDb();
  await db.delete(poultryEggRecords).where(eq(poultryEggRecords.id, recordId));
}

export async function createMortalityRecord(data: { flockId: string; date: Date; count: number; cause?: string; notes?: string }) {
  const db = getDb();
  const [row] = await db.insert(poultryMortality).values(data).returning();
  return row;
}

export async function deleteMortalityRecord(recordId: string) {
  const db = getDb();
  await db.delete(poultryMortality).where(eq(poultryMortality.id, recordId));
}
