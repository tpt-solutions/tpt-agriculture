import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { deerHerds, deerVelvetRecords, deerVenisonRecords } from "@tpt/core/schema";

export async function listHerds(farmId: string) {
  const db = getDb();
  return db.select().from(deerHerds).where(eq(deerHerds.farmId, farmId)).orderBy(asc(deerHerds.name));
}

export async function getHerd(farmId: string, herdId: string) {
  const db = getDb();
  const [herd] = await db.select().from(deerHerds)
    .where(and(eq(deerHerds.id, herdId), eq(deerHerds.farmId, farmId)))
    .limit(1);
  if (!herd) return null;
  const velvet = await db.select().from(deerVelvetRecords).where(eq(deerVelvetRecords.herdId, herdId)).orderBy(desc(deerVelvetRecords.harvestDate));
  const venison = await db.select().from(deerVenisonRecords).where(eq(deerVenisonRecords.herdId, herdId)).orderBy(desc(deerVenisonRecords.date));
  return { ...herd, velvetRecords: velvet, venisonRecords: venison };
}

export async function createHerd(farmId: string, data: { name: string; species?: string | null; headCount: number }) {
  const db = getDb();
  const [row] = await db.insert(deerHerds).values({ ...data, farmId }).returning();
  return row;
}

export async function updateHerd(farmId: string, herdId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(deerHerds).set(data)
    .where(and(eq(deerHerds.id, herdId), eq(deerHerds.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteHerd(farmId: string, herdId: string) {
  const db = getDb();
  await db.delete(deerHerds).where(and(eq(deerHerds.id, herdId), eq(deerHerds.farmId, farmId)));
}

export async function createVelvetRecord(data: { herdId: string; harvestDate: Date; velvetKg: number; stagId?: string; grade?: string; buyer?: string; pricePerKg?: number }) {
  const db = getDb();
  const [row] = await db.insert(deerVelvetRecords).values(data).returning();
  return row;
}

export async function deleteVelvetRecord(recordId: string) {
  const db = getDb();
  await db.delete(deerVelvetRecords).where(eq(deerVelvetRecords.id, recordId));
}

export async function createVenisonRecord(data: { herdId: string; date: Date; headCount: number; carcassKg: number; grade?: string; buyer?: string; pricePerKg?: number }) {
  const db = getDb();
  const [row] = await db.insert(deerVenisonRecords).values(data).returning();
  return row;
}

export async function deleteVenisonRecord(recordId: string) {
  const db = getDb();
  await db.delete(deerVenisonRecords).where(eq(deerVenisonRecords.id, recordId));
}
