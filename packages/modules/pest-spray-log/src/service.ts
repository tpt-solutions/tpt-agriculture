import { eq, and, asc, desc, gte } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { chemicals, sprayEvents, fields } from "@tpt/core/schema";
import type { CreateChemicalInput, UpdateChemicalInput, CreateSprayEventInput, UpdateSprayEventInput } from "./schemas.js";

export async function listChemicals(farmId: string) {
  const db = getDb();
  return db.select().from(chemicals).where(eq(chemicals.farmId, farmId)).orderBy(asc(chemicals.name));
}

export async function createChemical(farmId: string, data: CreateChemicalInput) {
  const db = getDb();
  const [row] = await db.insert(chemicals).values({ ...data, farmId }).returning();
  return row;
}

export async function updateChemical(farmId: string, chemicalId: string, data: UpdateChemicalInput) {
  const db = getDb();
  const [row] = await db.update(chemicals).set(data)
    .where(and(eq(chemicals.id, chemicalId), eq(chemicals.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteChemical(farmId: string, chemicalId: string) {
  const db = getDb();
  await db.delete(chemicals).where(and(eq(chemicals.id, chemicalId), eq(chemicals.farmId, farmId)));
}

export async function listSprayEvents(farmId: string) {
  const db = getDb();
  return db.select().from(sprayEvents).where(eq(sprayEvents.farmId, farmId)).orderBy(desc(sprayEvents.applicationDate));
}

export async function createSprayEvent(farmId: string, data: CreateSprayEventInput) {
  const db = getDb();
  const [row] = await db.insert(sprayEvents).values({ ...data, farmId }).returning();
  return row;
}

export async function updateSprayEvent(farmId: string, eventId: string, data: UpdateSprayEventInput) {
  const db = getDb();
  const [row] = await db.update(sprayEvents).set(data)
    .where(and(eq(sprayEvents.id, eventId), eq(sprayEvents.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteSprayEvent(farmId: string, eventId: string) {
  const db = getDb();
  await db.delete(sprayEvents).where(and(eq(sprayEvents.id, eventId), eq(sprayEvents.farmId, farmId)));
}
