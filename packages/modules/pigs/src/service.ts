import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { pigSows, pigLitters, pigFeedRecords } from "@tpt/core/schema";

export async function listSows(farmId: string) {
  const db = getDb();
  return db.select().from(pigSows).where(eq(pigSows.farmId, farmId)).orderBy(asc(pigSows.animalId));
}

export async function getSow(farmId: string, sowId: string) {
  const db = getDb();
  const [sow] = await db.select().from(pigSows)
    .where(and(eq(pigSows.id, sowId), eq(pigSows.farmId, farmId)))
    .limit(1);
  if (!sow) return null;
  const litters = await db.select().from(pigLitters).where(eq(pigLitters.sowId, sowId)).orderBy(desc(pigLitters.farrowDate));
  return { ...sow, litters };
}

export async function createSow(farmId: string, data: { animalId: string; breed?: string | null; status?: string }) {
  const db = getDb();
  const [row] = await db.insert(pigSows).values({ ...data, farmId }).returning();
  return row;
}

export async function updateSow(farmId: string, sowId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(pigSows).set(data)
    .where(and(eq(pigSows.id, sowId), eq(pigSows.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteSow(farmId: string, sowId: string) {
  const db = getDb();
  await db.delete(pigSows).where(and(eq(pigSows.id, sowId), eq(pigSows.farmId, farmId)));
}

export async function createLitter(data: { sowId: string; farrowDate: Date; pigletsBorn: number; pigletsAlive: number; pigletsWeaned?: number }) {
  const db = getDb();
  const [row] = await db.insert(pigLitters).values(data).returning();
  return row;
}

export async function deleteLitter(litterId: string) {
  const db = getDb();
  await db.delete(pigLitters).where(eq(pigLitters.id, litterId));
}

export async function listFeedRecords(farmId: string) {
  const db = getDb();
  return db.select().from(pigFeedRecords).where(eq(pigFeedRecords.farmId, farmId)).orderBy(desc(pigFeedRecords.date));
}

export async function createFeedRecord(farmId: string, data: { date: Date; groupName: string; headCount: number; feedType: string; feedKg: number; costPerKg?: number }) {
  const db = getDb();
  const [row] = await db.insert(pigFeedRecords).values({ ...data, farmId }).returning();
  return row;
}

export async function deleteFeedRecord(recordId: string) {
  const db = getDb();
  await db.delete(pigFeedRecords).where(eq(pigFeedRecords.id, recordId));
}
