import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { aquaSystems, fishStocks, waterQualityLogs, aquaFeedingEvents, aquaPlantYields } from "@tpt/core/schema";
import type { CreateAquaSystemInput, UpdateAquaSystemInput, CreateFishStockInput, UpdateFishStockInput, CreateWaterQualityLogInput, UpdateWaterQualityLogInput, CreateFeedingEventInput, CreatePlantYieldInput } from "./schemas.js";

export async function listSystems(farmId: string) {
  const db = getDb();
  return db.select().from(aquaSystems).where(eq(aquaSystems.farmId, farmId)).orderBy(asc(aquaSystems.name));
}

export async function getSystem(farmId: string, systemId: string) {
  const db = getDb();
  const [system] = await db.select().from(aquaSystems)
    .where(and(eq(aquaSystems.id, systemId), eq(aquaSystems.farmId, farmId)))
    .limit(1);
  if (!system) return null;
  const fish = await db.select().from(fishStocks).where(eq(fishStocks.systemId, systemId)).orderBy(desc(fishStocks.stockDate));
  const water = await db.select().from(waterQualityLogs).where(eq(waterQualityLogs.systemId, systemId)).orderBy(desc(waterQualityLogs.date)).limit(30);
  const feeding = await db.select().from(aquaFeedingEvents).where(eq(aquaFeedingEvents.systemId, systemId)).orderBy(desc(aquaFeedingEvents.date)).limit(20);
  const yields = await db.select().from(aquaPlantYields).where(eq(aquaPlantYields.systemId, systemId)).orderBy(desc(aquaPlantYields.date)).limit(20);
  return { ...system, fishStocks: fish, waterQualityLogs: water, feedingEvents: feeding, plantBedYields: yields };
}

export async function createSystem(farmId: string, data: CreateAquaSystemInput) {
  const db = getDb();
  const [row] = await db.insert(aquaSystems).values({ ...data, farmId }).returning();
  return row;
}

export async function updateSystem(farmId: string, systemId: string, data: UpdateAquaSystemInput) {
  const db = getDb();
  const [row] = await db.update(aquaSystems).set(data)
    .where(and(eq(aquaSystems.id, systemId), eq(aquaSystems.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteSystem(farmId: string, systemId: string) {
  const db = getDb();
  await db.delete(aquaSystems).where(and(eq(aquaSystems.id, systemId), eq(aquaSystems.farmId, farmId)));
}

export async function createFishStock(data: CreateFishStockInput) {
  const db = getDb();
  const [row] = await db.insert(fishStocks).values(data).returning();
  return row;
}

export async function updateFishStock(stockId: string, data: UpdateFishStockInput) {
  const db = getDb();
  const [row] = await db.update(fishStocks).set(data).where(eq(fishStocks.id, stockId)).returning();
  return row;
}

export async function logWaterQuality(data: CreateWaterQualityLogInput) {
  const db = getDb();
  const [row] = await db.insert(waterQualityLogs).values(data).returning();
  return row;
}

export async function updateWaterQualityLog(logId: string, data: UpdateWaterQualityLogInput) {
  const db = getDb();
  const [row] = await db.update(waterQualityLogs).set(data).where(eq(waterQualityLogs.id, logId)).returning();
  return row;
}

export async function logFeeding(data: CreateFeedingEventInput) {
  const db = getDb();
  const [row] = await db.insert(aquaFeedingEvents).values(data).returning();
  return row;
}

export async function logPlantYield(data: CreatePlantYieldInput) {
  const db = getDb();
  const [row] = await db.insert(aquaPlantYields).values(data).returning();
  return row;
}
