import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { paddocks, paddockRotations, pastureCoverRecords } from "@tpt/core/schema";

export async function listPaddocks(farmId: string) {
  const db = getDb();
  return db.select().from(paddocks).where(eq(paddocks.farmId, farmId)).orderBy(asc(paddocks.name));
}

export async function getPaddock(farmId: string, paddockId: string) {
  const db = getDb();
  const [paddock] = await db.select().from(paddocks)
    .where(and(eq(paddocks.id, paddockId), eq(paddocks.farmId, farmId)))
    .limit(1);
  if (!paddock) return null;
  const rotations = await db.select().from(paddockRotations).where(eq(paddockRotations.paddockId, paddockId)).orderBy(desc(paddockRotations.startDate));
  const covers = await db.select().from(pastureCoverRecords).where(eq(pastureCoverRecords.paddockId, paddockId)).orderBy(desc(pastureCoverRecords.date)).limit(30);
  return { ...paddock, rotations, coverRecords: covers };
}

export async function createPaddock(farmId: string, data: { name: string; areaHa: number; soilType?: string; grassType?: string }) {
  const db = getDb();
  const [row] = await db.insert(paddocks).values({ ...data, farmId }).returning();
  return row;
}

export async function updatePaddock(farmId: string, paddockId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(paddocks).set(data)
    .where(and(eq(paddocks.id, paddockId), eq(paddocks.farmId, farmId)))
    .returning();
  return row;
}

export async function deletePaddock(farmId: string, paddockId: string) {
  const db = getDb();
  await db.delete(paddocks).where(and(eq(paddocks.id, paddockId), eq(paddocks.farmId, farmId)));
}

export async function createRotation(data: { paddockId: string; startDate: Date; endDate?: Date; stockType?: string; headCount?: number }) {
  const db = getDb();
  const [row] = await db.insert(paddockRotations).values(data).returning();
  return row;
}

export async function deleteRotation(rotationId: string) {
  const db = getDb();
  await db.delete(paddockRotations).where(eq(paddockRotations.id, rotationId));
}

export async function createCoverRecord(data: { paddockId: string; date: Date; coverKgHa: number; method?: string; growthRate?: number }) {
  const db = getDb();
  const [row] = await db.insert(pastureCoverRecords).values(data).returning();
  return row;
}

export async function deleteCoverRecord(recordId: string) {
  const db = getDb();
  await db.delete(pastureCoverRecords).where(eq(pastureCoverRecords.id, recordId));
}
