import { db } from "@tpt/core";
import type {
  CreateAquaSystemInput, UpdateAquaSystemInput,
  CreateFishStockInput, UpdateFishStockInput,
  CreateWaterQualityLogInput, UpdateWaterQualityLogInput,
  CreateFeedingEventInput, CreatePlantYieldInput,
} from "./schemas.js";

export async function listSystems(tenantId: string) {
  return db.aquaSystem.findMany({
    where: { tenantId },
    include: { fishStocks: { orderBy: { stockDate: "desc" }, take: 1 } },
    orderBy: { name: "asc" },
  });
}

export async function getSystem(tenantId: string, systemId: string) {
  return db.aquaSystem.findFirst({
    where: { id: systemId, tenantId },
    include: {
      fishStocks: { orderBy: { stockDate: "desc" } },
      waterQualityLogs: { orderBy: { date: "desc" }, take: 30 },
      feedingEvents: { orderBy: { date: "desc" }, take: 20 },
      plantBedYields: { orderBy: { date: "desc" }, take: 20 },
    },
  });
}

export async function createSystem(tenantId: string, data: CreateAquaSystemInput) {
  return db.aquaSystem.create({ data: { ...data, tenantId } });
}

export async function updateSystem(tenantId: string, systemId: string, data: UpdateAquaSystemInput) {
  return db.aquaSystem.update({ where: { id: systemId, tenantId }, data });
}

export async function deleteSystem(tenantId: string, systemId: string) {
  return db.aquaSystem.delete({ where: { id: systemId, tenantId } });
}

export async function createFishStock(data: CreateFishStockInput) {
  return db.fishStock.create({ data });
}

export async function updateFishStock(stockId: string, data: UpdateFishStockInput) {
  return db.fishStock.update({ where: { id: stockId }, data });
}

export async function logWaterQuality(data: CreateWaterQualityLogInput) {
  return db.waterQualityLog.create({ data });
}

export async function updateWaterQualityLog(logId: string, data: UpdateWaterQualityLogInput) {
  return db.waterQualityLog.update({ where: { id: logId }, data });
}

export async function logFeeding(data: CreateFeedingEventInput) {
  return db.aquaFeedingEvent.create({ data });
}

export async function logPlantYield(data: CreatePlantYieldInput) {
  return db.aquaPlantYield.create({ data });
}

export async function getLatestWaterQuality(tenantId: string) {
  const systems = await db.aquaSystem.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });
  return Promise.all(
    systems.map(async (s) => {
      const latest = await db.waterQualityLog.findFirst({
        where: { systemId: s.id },
        orderBy: { date: "desc" },
      });
      return { system: s, latest };
    })
  );
}
