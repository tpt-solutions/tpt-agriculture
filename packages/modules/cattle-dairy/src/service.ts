import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { dairyCows, dairyMilkRecords, dairyHealthEvents } from "@tpt/core/schema";

export async function listCows(farmId: string) {
  const db = getDb();
  return db.select().from(dairyCows).where(eq(dairyCows.farmId, farmId)).orderBy(asc(dairyCows.animalId));
}

export async function getCow(farmId: string, cowId: string) {
  const db = getDb();
  const [cow] = await db.select().from(dairyCows)
    .where(and(eq(dairyCows.id, cowId), eq(dairyCows.farmId, farmId)))
    .limit(1);
  if (!cow) return null;
  const milk = await db.select().from(dairyMilkRecords).where(eq(dairyMilkRecords.cowId, cowId)).orderBy(desc(dairyMilkRecords.date)).limit(30);
  const health = await db.select().from(dairyHealthEvents).where(eq(dairyHealthEvents.cowId, cowId)).orderBy(desc(dairyHealthEvents.date));
  return { ...cow, milkRecords: milk, healthEvents: health };
}

export async function createCow(farmId: string, data: { animalId: string; breed?: string | null; sex?: string; currentStatus?: string }) {
  const db = getDb();
  const [row] = await db.insert(dairyCows).values({ ...data, farmId }).returning();
  return row;
}

export async function updateCow(farmId: string, cowId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(dairyCows).set(data)
    .where(and(eq(dairyCows.id, cowId), eq(dairyCows.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteCow(farmId: string, cowId: string) {
  const db = getDb();
  await db.delete(dairyCows).where(and(eq(dairyCows.id, cowId), eq(dairyCows.farmId, farmId)));
}

export async function createMilkRecord(data: { cowId: string; date: Date; liters: number; fatPct?: number; proteinPct?: number; scc?: number; comments?: string }) {
  const db = getDb();
  const [row] = await db.insert(dairyMilkRecords).values(data).returning();
  return row;
}

export async function deleteMilkRecord(recordId: string) {
  const db = getDb();
  await db.delete(dairyMilkRecords).where(eq(dairyMilkRecords.id, recordId));
}

export async function createHealthEvent(data: { cowId: string; date: Date; eventType: string; description: string; withdrawn?: boolean }) {
  const db = getDb();
  const [row] = await db.insert(dairyHealthEvents).values(data).returning();
  return row;
}

export async function deleteHealthEvent(eventId: string) {
  const db = getDb();
  await db.delete(dairyHealthEvents).where(eq(dairyHealthEvents.id, eventId));
}
