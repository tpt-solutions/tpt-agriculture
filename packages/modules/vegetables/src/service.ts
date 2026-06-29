import { eq, and, asc, desc, lte, isNull } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { vegBeds, vegSuccessions } from "@tpt/core/schema";
import type { CreateVegBedInput, UpdateVegBedInput, CreateVegSuccessionInput, UpdateVegSuccessionInput } from "./schemas.js";

export async function listBeds(farmId: string) {
  const db = getDb();
  return db.select().from(vegBeds).where(eq(vegBeds.farmId, farmId)).orderBy(asc(vegBeds.name));
}

export async function getBed(farmId: string, bedId: string) {
  const db = getDb();
  const [bed] = await db.select().from(vegBeds)
    .where(and(eq(vegBeds.id, bedId), eq(vegBeds.farmId, farmId)))
    .limit(1);
  if (!bed) return null;
  const successions = await db.select().from(vegSuccessions).where(eq(vegSuccessions.bedId, bedId)).orderBy(desc(vegSuccessions.plantDate));
  return { ...bed, successions };
}

export async function createBed(farmId: string, data: CreateVegBedInput) {
  const db = getDb();
  const [row] = await db.insert(vegBeds).values({ ...data, farmId }).returning();
  return row;
}

export async function updateBed(farmId: string, bedId: string, data: UpdateVegBedInput) {
  const db = getDb();
  const [row] = await db.update(vegBeds).set(data)
    .where(and(eq(vegBeds.id, bedId), eq(vegBeds.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteBed(farmId: string, bedId: string) {
  const db = getDb();
  await db.delete(vegBeds).where(and(eq(vegBeds.id, bedId), eq(vegBeds.farmId, farmId)));
}

export async function createSuccession(data: CreateVegSuccessionInput) {
  const db = getDb();
  const [row] = await db.insert(vegSuccessions).values(data).returning();
  return row;
}

export async function updateSuccession(successionId: string, data: UpdateVegSuccessionInput) {
  const db = getDb();
  const [row] = await db.update(vegSuccessions).set(data).where(eq(vegSuccessions.id, successionId)).returning();
  return row;
}

export async function deleteSuccession(successionId: string) {
  const db = getDb();
  await db.delete(vegSuccessions).where(eq(vegSuccessions.id, successionId));
}
