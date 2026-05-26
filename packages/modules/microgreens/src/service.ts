import { db } from "@tpt/core";
import type { CreateMicrogreenBatchInput, UpdateMicrogreenBatchInput, CreateMicrogreenTrayInput, UpdateMicrogreenTrayInput } from "./schemas.js";

export async function listBatches(tenantId: string) {
  return db.microgreenBatch.findMany({
    where: { tenantId },
    include: { trays: true },
    orderBy: { seedingDate: "desc" },
  });
}

export async function getBatch(tenantId: string, batchId: string) {
  return db.microgreenBatch.findFirst({
    where: { id: batchId, tenantId },
    include: { trays: { orderBy: { trayNumber: "asc" } } },
  });
}

export async function createBatch(tenantId: string, data: CreateMicrogreenBatchInput) {
  return db.microgreenBatch.create({ data: { ...data, tenantId } });
}

export async function updateBatch(tenantId: string, batchId: string, data: UpdateMicrogreenBatchInput) {
  return db.microgreenBatch.update({ where: { id: batchId, tenantId }, data });
}

export async function deleteBatch(tenantId: string, batchId: string) {
  return db.microgreenBatch.delete({ where: { id: batchId, tenantId } });
}

export async function createTray(data: CreateMicrogreenTrayInput) {
  return db.microgreenTray.create({ data });
}

export async function updateTray(trayId: string, data: UpdateMicrogreenTrayInput) {
  return db.microgreenTray.update({ where: { id: trayId }, data });
}

export async function deleteTray(trayId: string) {
  return db.microgreenTray.delete({ where: { id: trayId } });
}

export async function getActiveBatches(tenantId: string) {
  return db.microgreenBatch.findMany({
    where: { tenantId, actualHarvestDate: null },
    orderBy: { expectedHarvestDate: "asc" },
  });
}

export async function getRevenueSummary(tenantId: string, fromDate: Date, toDate: Date) {
  const batches = await db.microgreenBatch.findMany({
    where: {
      tenantId,
      seedingDate: { gte: fromDate, lte: toDate },
      revenueNzd: { not: null },
    },
    select: { variety: true, trayCount: true, yieldGrams: true, revenueNzd: true },
  });
  return batches;
}
