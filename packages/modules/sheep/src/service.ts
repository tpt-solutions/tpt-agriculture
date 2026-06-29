import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { sheepFlocks, sheepLambingRecords, sheepDrenchingRecords, sheepShearingRecords } from "@tpt/core/schema";

export async function listFlocks(farmId: string) {
  const db = getDb();
  return db.select().from(sheepFlocks).where(eq(sheepFlocks.farmId, farmId)).orderBy(asc(sheepFlocks.name));
}

export async function getFlock(farmId: string, flockId: string) {
  const db = getDb();
  const [flock] = await db.select().from(sheepFlocks)
    .where(and(eq(sheepFlocks.id, flockId), eq(sheepFlocks.farmId, farmId)))
    .limit(1);
  if (!flock) return null;
  const lambing = await db.select().from(sheepLambingRecords).where(eq(sheepLambingRecords.flockId, flockId)).orderBy(desc(sheepLambingRecords.date));
  const drenching = await db.select().from(sheepDrenchingRecords).where(eq(sheepDrenchingRecords.flockId, flockId)).orderBy(desc(sheepDrenchingRecords.date));
  const shearing = await db.select().from(sheepShearingRecords).where(eq(sheepShearingRecords.flockId, flockId)).orderBy(desc(sheepShearingRecords.date));
  return { ...flock, lambingRecords: lambing, drenchingRecords: drenching, shearingRecords: shearing };
}

export async function createFlock(farmId: string, data: { name: string; breed?: string | null; headCount: number }) {
  const db = getDb();
  const [row] = await db.insert(sheepFlocks).values({ ...data, farmId }).returning();
  return row;
}

export async function updateFlock(farmId: string, flockId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(sheepFlocks).set(data)
    .where(and(eq(sheepFlocks.id, flockId), eq(sheepFlocks.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteFlock(farmId: string, flockId: string) {
  const db = getDb();
  await db.delete(sheepFlocks).where(and(eq(sheepFlocks.id, flockId), eq(sheepFlocks.farmId, farmId)));
}

export async function createLambingRecord(data: { flockId: string; season: string; ewesLambed: number; lambsBorn: number; lambsAlive: number; date: Date }) {
  const db = getDb();
  const [row] = await db.insert(sheepLambingRecords).values(data).returning();
  return row;
}

export async function deleteLambingRecord(recordId: string) {
  const db = getDb();
  await db.delete(sheepLambingRecords).where(eq(sheepLambingRecords.id, recordId));
}

export async function createDrenchingRecord(data: { flockId: string; date: Date; product: string; headCount: number; doseMl?: number }) {
  const db = getDb();
  const [row] = await db.insert(sheepDrenchingRecords).values(data).returning();
  return row;
}

export async function deleteDrenchingRecord(recordId: string) {
  const db = getDb();
  await db.delete(sheepDrenchingRecords).where(eq(sheepDrenchingRecords.id, recordId));
}

export async function createShearingRecord(data: { flockId: string; date: Date; headCount: number; woolKg: number; woolGrade?: string; buyer?: string; pricePerKg?: number }) {
  const db = getDb();
  const [row] = await db.insert(sheepShearingRecords).values(data).returning();
  return row;
}

export async function deleteShearingRecord(recordId: string) {
  const db = getDb();
  await db.delete(sheepShearingRecords).where(eq(sheepShearingRecords.id, recordId));
}
