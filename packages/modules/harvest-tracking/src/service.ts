import { db } from "@tpt/core";
import type { CreateHarvestBatchInput, UpdateHarvestBatchInput, CreateHarvestRecordInput, UpdateHarvestRecordInput } from "./schemas.js";

export async function listHarvestBatches(tenantId: string) {
  return db.harvestBatch.findMany({
    where: { tenantId },
    include: { records: true, field: { select: { name: true } } },
    orderBy: { harvestDate: "desc" },
  });
}

export async function getHarvestBatch(tenantId: string, batchId: string) {
  return db.harvestBatch.findFirst({
    where: { id: batchId, tenantId },
    include: { records: { include: { plot: true } }, field: true },
  });
}

export async function createHarvestBatch(tenantId: string, data: CreateHarvestBatchInput) {
  return db.harvestBatch.create({ data: { ...data, tenantId } });
}

export async function updateHarvestBatch(tenantId: string, batchId: string, data: UpdateHarvestBatchInput) {
  return db.harvestBatch.update({ where: { id: batchId, tenantId }, data });
}

export async function deleteHarvestBatch(tenantId: string, batchId: string) {
  return db.harvestBatch.delete({ where: { id: batchId, tenantId } });
}

export async function createHarvestRecord(data: CreateHarvestRecordInput) {
  return db.harvestRecord.create({ data });
}

export async function updateHarvestRecord(recordId: string, data: UpdateHarvestRecordInput) {
  return db.harvestRecord.update({ where: { id: recordId }, data });
}

export async function deleteHarvestRecord(recordId: string) {
  return db.harvestRecord.delete({ where: { id: recordId } });
}

export async function getYieldSummary(tenantId: string, fromDate: Date, toDate: Date) {
  const batches = await db.harvestBatch.findMany({
    where: { tenantId, harvestDate: { gte: fromDate, lte: toDate } },
    select: { cropVariety: true, totalYieldKg: true, pricePerKg: true },
  });
  return batches.reduce<Record<string, { totalKg: number; revenue: number }>>((acc, b) => {
    const key = b.cropVariety;
    if (!acc[key]) acc[key] = { totalKg: 0, revenue: 0 };
    acc[key].totalKg += b.totalYieldKg;
    if (b.pricePerKg) acc[key].revenue += b.totalYieldKg * b.pricePerKg;
    return acc;
  }, {});
}
