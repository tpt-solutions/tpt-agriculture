import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { beeHives, beeInspections, beeHoneyHarvests } from "@tpt/core/schema";

export async function listHives(farmId: string) {
  const db = getDb();
  return db.select().from(beeHives).where(eq(beeHives.farmId, farmId)).orderBy(asc(beeHives.hiveName));
}

export async function getHive(farmId: string, hiveId: string) {
  const db = getDb();
  const [hive] = await db.select().from(beeHives)
    .where(and(eq(beeHives.id, hiveId), eq(beeHives.farmId, farmId)))
    .limit(1);
  if (!hive) return null;
  const inspections = await db.select().from(beeInspections).where(eq(beeInspections.hiveId, hiveId)).orderBy(desc(beeInspections.date));
  const harvests = await db.select().from(beeHoneyHarvests).where(eq(beeHoneyHarvests.hiveId, hiveId)).orderBy(desc(beeHoneyHarvests.date));
  return { ...hive, inspections, honeyHarvests: harvests };
}

export async function createHive(farmId: string, data: { hiveName: string; hiveType?: string; location?: string; queenAge?: number; queenColor?: string; origin?: string }) {
  const db = getDb();
  const [row] = await db.insert(beeHives).values({ ...data, farmId }).returning();
  return row;
}

export async function updateHive(farmId: string, hiveId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(beeHives).set(data)
    .where(and(eq(beeHives.id, hiveId), eq(beeHives.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteHive(farmId: string, hiveId: string) {
  const db = getDb();
  await db.delete(beeHives).where(and(eq(beeHives.id, hiveId), eq(beeHives.farmId, farmId)));
}

export async function createInspection(data: { hiveId: string; date: Date; temperament?: string; queenSeen?: boolean; eggsPresent?: boolean; broodPattern?: string; miteCount?: number; action?: string; notes?: string }) {
  const db = getDb();
  const [row] = await db.insert(beeInspections).values(data).returning();
  return row;
}

export async function deleteInspection(inspectionId: string) {
  const db = getDb();
  await db.delete(beeInspections).where(eq(beeInspections.id, inspectionId));
}

export async function createHoneyHarvest(data: { hiveId: string; date: Date; kg: number; type?: string; grade?: string; buyer?: string; pricePerKg?: number }) {
  const db = getDb();
  const [row] = await db.insert(beeHoneyHarvests).values(data).returning();
  return row;
}

export async function deleteHoneyHarvest(harvestId: string) {
  const db = getDb();
  await db.delete(beeHoneyHarvests).where(eq(beeHoneyHarvests.id, harvestId));
}
