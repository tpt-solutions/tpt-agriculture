import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { beefMobs, beefWeightRecords, beefDraftings } from "@tpt/core/schema";

export async function listMobs(farmId: string) {
  const db = getDb();
  return db.select().from(beefMobs).where(eq(beefMobs.farmId, farmId)).orderBy(asc(beefMobs.name));
}

export async function getMob(farmId: string, mobId: string) {
  const db = getDb();
  const [mob] = await db.select().from(beefMobs)
    .where(and(eq(beefMobs.id, mobId), eq(beefMobs.farmId, farmId)))
    .limit(1);
  if (!mob) return null;
  const weights = await db.select().from(beefWeightRecords).where(eq(beefWeightRecords.mobId, mobId)).orderBy(desc(beefWeightRecords.date));
  const draftings = await db.select().from(beefDraftings).where(eq(beefDraftings.mobId, mobId)).orderBy(desc(beefDraftings.date));
  return { ...mob, weightRecords: weights, draftings };
}

export async function createMob(farmId: string, data: { name: string; breed?: string | null; headCount: number; location?: string | null; targetWeightKg?: number | null }) {
  const db = getDb();
  const [row] = await db.insert(beefMobs).values({ ...data, farmId }).returning();
  return row;
}

export async function updateMob(farmId: string, mobId: string, data: Record<string, unknown>) {
  const db = getDb();
  const [row] = await db.update(beefMobs).set(data)
    .where(and(eq(beefMobs.id, mobId), eq(beefMobs.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteMob(farmId: string, mobId: string) {
  const db = getDb();
  await db.delete(beefMobs).where(and(eq(beefMobs.id, mobId), eq(beefMobs.farmId, farmId)));
}

export async function createWeightRecord(data: { mobId: string; date: Date; avgWeightKg: number; sampleCount?: number; notes?: string }) {
  const db = getDb();
  const [row] = await db.insert(beefWeightRecords).values(data).returning();
  return row;
}

export async function deleteWeightRecord(recordId: string) {
  const db = getDb();
  await db.delete(beefWeightRecords).where(eq(beefWeightRecords.id, recordId));
}

export async function createDrafting(data: { mobId: string; date: Date; headCount: number; avgWeightKg: number; destination: string; notes?: string }) {
  const db = getDb();
  const [row] = await db.insert(beefDraftings).values(data).returning();
  return row;
}

export async function deleteDrafting(draftingId: string) {
  const db = getDb();
  await db.delete(beefDraftings).where(eq(beefDraftings.id, draftingId));
}
