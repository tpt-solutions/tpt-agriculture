import { db } from "@tpt/core";
import { beefMobSchema, beefWeightRecordSchema, beefDraftingSchema } from "./index.js";

// ─── Mobs CRUD ────────────────────────────────────────────────────────────

export async function getMobs(tenantId: string) {
  return db.beefMob.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      weightRecords: { orderBy: { date: "desc" }, take: 5 },
    },
  });
}

export async function getMob(id: string, tenantId: string) {
  return db.beefMob.findFirst({ where: { id, tenantId } });
}

export async function createMob(data: unknown) {
  const parsed = beefMobSchema.parse(data);
  return db.beefMob.create({ data: { ...parsed, id: undefined } });
}

export async function updateMob(id: string, tenantId: string, data: unknown) {
  const parsed = beefMobSchema.partial().parse(data);
  return db.beefMob.update({ where: { id }, data: parsed });
}

export async function deleteMob(id: string) {
  return db.beefMob.delete({ where: { id } });
}

// ─── Weight Records ──────────────────────────────────────────────────────

export async function getWeightRecords(mobId: string) {
  return db.beefWeightRecord.findMany({
    where: { mobId },
    orderBy: { date: "desc" },
  });
}

export async function createWeightRecord(data: unknown) {
  const parsed = beefWeightRecordSchema.parse(data);
  return db.beefWeightRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteWeightRecord(id: string) {
  return db.beefWeightRecord.delete({ where: { id } });
}

// ─── Drafting ─────────────────────────────────────────────────────────────

export async function getDraftings(mobId: string) {
  return db.beefDrafting.findMany({
    where: { mobId },
    orderBy: { date: "desc" },
  });
}

export async function createDrafting(data: unknown) {
  const parsed = beefDraftingSchema.parse(data);
  return db.beefDrafting.create({ data: { ...parsed, id: undefined } });
}

export async function deleteDrafting(id: string) {
  return db.beefDrafting.delete({ where: { id } });
}