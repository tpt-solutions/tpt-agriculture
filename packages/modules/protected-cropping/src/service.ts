import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { structures, climateLogs, fertigationEvents } from "@tpt/core/schema";
import type { CreateStructureInput, UpdateStructureInput, CreateClimateLogInput, UpdateClimateLogInput, CreateFertigationEventInput, UpdateFertigationEventInput } from "./schemas.js";

export async function listStructures(farmId: string) {
  const db = getDb();
  return db.select().from(structures).where(eq(structures.farmId, farmId)).orderBy(asc(structures.name));
}

export async function getStructure(farmId: string, structureId: string) {
  const db = getDb();
  const [structure] = await db.select().from(structures)
    .where(and(eq(structures.id, structureId), eq(structures.farmId, farmId)))
    .limit(1);
  if (!structure) return null;
  const climate = await db.select().from(climateLogs).where(eq(climateLogs.structureId, structureId)).orderBy(desc(climateLogs.date)).limit(30);
  const fertigation = await db.select().from(fertigationEvents).where(eq(fertigationEvents.structureId, structureId)).orderBy(desc(fertigationEvents.date)).limit(20);
  return { ...structure, climateLogs: climate, fertigationEvents: fertigation };
}

export async function createStructure(farmId: string, data: CreateStructureInput) {
  const db = getDb();
  const [row] = await db.insert(structures).values({ ...data, farmId }).returning();
  return row;
}

export async function updateStructure(farmId: string, structureId: string, data: UpdateStructureInput) {
  const db = getDb();
  const [row] = await db.update(structures).set(data)
    .where(and(eq(structures.id, structureId), eq(structures.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteStructure(farmId: string, structureId: string) {
  const db = getDb();
  await db.delete(structures).where(and(eq(structures.id, structureId), eq(structures.farmId, farmId)));
}

export async function createClimateLog(data: CreateClimateLogInput) {
  const db = getDb();
  const [row] = await db.insert(climateLogs).values(data).returning();
  return row;
}

export async function updateClimateLog(logId: string, data: UpdateClimateLogInput) {
  const db = getDb();
  const [row] = await db.update(climateLogs).set(data).where(eq(climateLogs.id, logId)).returning();
  return row;
}

export async function deleteClimateLog(logId: string) {
  const db = getDb();
  await db.delete(climateLogs).where(eq(climateLogs.id, logId));
}

export async function createFertigationEvent(data: CreateFertigationEventInput) {
  const db = getDb();
  const [row] = await db.insert(fertigationEvents).values(data).returning();
  return row;
}

export async function updateFertigationEvent(eventId: string, data: UpdateFertigationEventInput) {
  const db = getDb();
  const [row] = await db.update(fertigationEvents).set(data).where(eq(fertigationEvents.id, eventId)).returning();
  return row;
}

export async function deleteFertigationEvent(eventId: string) {
  const db = getDb();
  await db.delete(fertigationEvents).where(eq(fertigationEvents.id, eventId));
}
