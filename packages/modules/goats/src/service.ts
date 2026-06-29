import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { goatHerds, goatMilkRecords, goatFibreRecords } from "@tpt/core/schema";

export async function listHerds(farmId: string) {
  const db = getDb();
  return db.select().from(goatHerds).where(eq(goatHerds.farmId, farmId)).orderBy(asc(goatHerds.name));
}

export async function getHerd(farmId: string, herdId: string) {
  const db = getDb();
  const [herd] = await db.select().from(goatHerds)
    .where(and(eq(goatHerds.id, herdId), eq(goatHerds.farmId, farmId)))
    .limit(1);
  if (!herd) return null;
  const milk = await db.select().from(goatMilkRecords).where(eq(goatMilkRecords.herdId, herdId)).orderBy(desc(goatMilkRecords.date)).limit(30);
  const fibre = await db.select().from(goatFibreRecords).where(eq(goatFibreRecords.herdId, herdId)).orderBy(desc(goatFibreRecords.date));
  return { ...herd, milkRecords: milk, fibreRecords: fibre };
}

export async function createHerd(farmId: string, data: { name: string; breed?: string | null; headCount: number; type?: string }) {
  const db = getDb();
  const [row] = await db.insert(goatHerds).values({ ...data, farmId }).returning();
  return row;
}

export async function updateHerd(farmId: string, herdId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(goatHerds).set(data)
    .where(and(eq(goatHerds.id, herdId), eq(goatHerds.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteHerd(farmId: string, herdId: string) {
  const db = getDb();
  await db.delete(goatHerds).where(and(eq(goatHerds.id, herdId), eq(goatHerds.farmId, farmId)));
}

export async function createMilkRecord(data: { herdId: string; date: Date; liters: number; butterfat?: number; protein?: number }) {
  const db = getDb();
  const [row] = await db.insert(goatMilkRecords).values(data).returning();
  return row;
}

export async function deleteMilkRecord(recordId: string) {
  const db = getDb();
  await db.delete(goatMilkRecords).where(eq(goatMilkRecords.id, recordId));
}

export async function createFibreRecord(data: { herdId: string; date: Date; fibreKg: number; fibreType?: string; grade?: string; buyer?: string; pricePerKg?: number }) {
  const db = getDb();
  const [row] = await db.insert(goatFibreRecords).values(data).returning();
  return row;
}

export async function deleteFibreRecord(recordId: string) {
  const db = getDb();
  await db.delete(goatFibreRecords).where(eq(goatFibreRecords.id, recordId));
}
