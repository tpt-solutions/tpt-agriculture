import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { orchardBlocks, treeInventory, orchardHarvestBins } from "@tpt/core/schema";
import type { CreateOrchardBlockInput, UpdateOrchardBlockInput, CreateTreeInventoryInput, UpdateTreeInventoryInput, CreateHarvestBinInput, UpdateHarvestBinInput } from "./schemas.js";

export async function listBlocks(farmId: string) {
  const db = getDb();
  return db.select().from(orchardBlocks).where(eq(orchardBlocks.farmId, farmId)).orderBy(asc(orchardBlocks.name));
}

export async function getBlock(farmId: string, blockId: string) {
  const db = getDb();
  const [block] = await db.select().from(orchardBlocks)
    .where(and(eq(orchardBlocks.id, blockId), eq(orchardBlocks.farmId, farmId)))
    .limit(1);
  if (!block) return null;
  const inventory = await db.select().from(treeInventory).where(eq(treeInventory.blockId, blockId));
  const bins = await db.select().from(orchardHarvestBins).where(eq(orchardHarvestBins.blockId, blockId)).orderBy(desc(orchardHarvestBins.harvestDate)).limit(20);
  return { ...block, treeInventory: inventory, harvestBins: bins };
}

export async function createBlock(farmId: string, data: CreateOrchardBlockInput) {
  const db = getDb();
  const [row] = await db.insert(orchardBlocks).values({ ...data, farmId }).returning();
  return row;
}

export async function updateBlock(farmId: string, blockId: string, data: UpdateOrchardBlockInput) {
  const db = getDb();
  const [row] = await db.update(orchardBlocks).set(data)
    .where(and(eq(orchardBlocks.id, blockId), eq(orchardBlocks.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteBlock(farmId: string, blockId: string) {
  const db = getDb();
  await db.delete(orchardBlocks).where(and(eq(orchardBlocks.id, blockId), eq(orchardBlocks.farmId, farmId)));
}

export async function createTreeInventory(data: CreateTreeInventoryInput) {
  const db = getDb();
  const [row] = await db.insert(treeInventory).values(data).returning();
  return row;
}

export async function updateTreeInventory(inventoryId: string, data: UpdateTreeInventoryInput) {
  const db = getDb();
  const [row] = await db.update(treeInventory).set(data).where(eq(treeInventory.id, inventoryId)).returning();
  return row;
}

export async function createHarvestBin(data: CreateHarvestBinInput) {
  const db = getDb();
  const [row] = await db.insert(orchardHarvestBins).values(data).returning();
  return row;
}

export async function updateHarvestBin(binId: string, data: UpdateHarvestBinInput) {
  const db = getDb();
  const [row] = await db.update(orchardHarvestBins).set(data).where(eq(orchardHarvestBins.id, binId)).returning();
  return row;
}

export async function deleteHarvestBin(binId: string) {
  const db = getDb();
  await db.delete(orchardHarvestBins).where(eq(orchardHarvestBins.id, binId));
}
