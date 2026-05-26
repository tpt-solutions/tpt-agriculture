import { db } from "@tpt/core";
import { beeHiveSchema, beeInspectionSchema, beeHoneyHarvestSchema } from "./index.js";

// ─── Hives CRUD ──────────────────────────────────────────────────────────

export async function getHives(tenantId: string) {
  return db.beeHive.findMany({ where: { tenantId }, orderBy: { hiveName: "asc" } });
}

export async function getHive(id: string, tenantId: string) {
  return db.beeHive.findFirst({ where: { id, tenantId } });
}

export async function createHive(data: unknown) {
  const parsed = beeHiveSchema.parse(data);
  return db.beeHive.create({ data: { ...parsed, id: undefined } });
}

export async function updateHive(id: string, tenantId: string, data: unknown) {
  const parsed = beeHiveSchema.partial().parse(data);
  return db.beeHive.update({ where: { id }, data: parsed });
}

export async function deleteHive(id: string) {
  return db.beeHive.delete({ where: { id } });
}

// ─── Inspections ────────────────────────────────────────────────────────

export async function getInspections(hiveId: string) {
  return db.beeInspection.findMany({ where: { hiveId }, orderBy: { date: "desc" } });
}

export async function createInspection(data: unknown) {
  const parsed = beeInspectionSchema.parse(data);
  return db.beeInspection.create({ data: { ...parsed, id: undefined } });
}

export async function deleteInspection(id: string) {
  return db.beeInspection.delete({ where: { id } });
}

// ─── Honey Harvests ─────────────────────────────────────────────────────

export async function getHoneyHarvests(hiveId: string) {
  return db.beeHoneyHarvest.findMany({ where: { hiveId }, orderBy: { date: "desc" } });
}

export async function createHoneyHarvest(data: unknown) {
  const parsed = beeHoneyHarvestSchema.parse(data);
  return db.beeHoneyHarvest.create({ data: { ...parsed, id: undefined } });
}

export async function deleteHoneyHarvest(id: string) {
  return db.beeHoneyHarvest.delete({ where: { id } });
}