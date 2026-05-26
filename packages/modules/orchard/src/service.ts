import { db } from "@tpt/core";
import type { CreateOrchardBlockInput, UpdateOrchardBlockInput, CreateTreeInventoryInput, UpdateTreeInventoryInput, CreateHarvestBinInput, UpdateHarvestBinInput } from "./schemas.js";

export async function listBlocks(tenantId: string) {
  return db.orchardBlock.findMany({
    where: { tenantId },
    include: { treeInventory: true },
    orderBy: { name: "asc" },
  });
}

export async function getBlock(tenantId: string, blockId: string) {
  return db.orchardBlock.findFirst({
    where: { id: blockId, tenantId },
    include: {
      treeInventory: true,
      harvestBins: { orderBy: { harvestDate: "desc" }, take: 20 },
    },
  });
}

export async function createBlock(tenantId: string, data: CreateOrchardBlockInput) {
  return db.orchardBlock.create({ data: { ...data, tenantId } });
}

export async function updateBlock(tenantId: string, blockId: string, data: UpdateOrchardBlockInput) {
  return db.orchardBlock.update({ where: { id: blockId, tenantId }, data });
}

export async function deleteBlock(tenantId: string, blockId: string) {
  return db.orchardBlock.delete({ where: { id: blockId, tenantId } });
}

export async function createTreeInventory(data: CreateTreeInventoryInput) {
  return db.treeInventory.create({ data });
}

export async function updateTreeInventory(inventoryId: string, data: UpdateTreeInventoryInput) {
  return db.treeInventory.update({ where: { id: inventoryId }, data });
}

export async function createHarvestBin(data: CreateHarvestBinInput) {
  return db.orchardHarvestBin.create({ data });
}

export async function updateHarvestBin(binId: string, data: UpdateHarvestBinInput) {
  return db.orchardHarvestBin.update({ where: { id: binId }, data });
}

export async function deleteHarvestBin(binId: string) {
  return db.orchardHarvestBin.delete({ where: { id: binId } });
}
