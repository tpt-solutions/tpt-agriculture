import { db } from "@tpt/core";
import { deerHerdSchema, deerVelvetRecordSchema, deerVenisonRecordSchema } from "./index.js";

// ─── Herds CRUD ──────────────────────────────────────────────────────────

export async function getHerds(tenantId: string) {
  return db.deerHerd.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
}

export async function getHerd(id: string, tenantId: string) {
  return db.deerHerd.findFirst({ where: { id, tenantId } });
}

export async function createHerd(data: unknown) {
  const parsed = deerHerdSchema.parse(data);
  return db.deerHerd.create({ data: { ...parsed, id: undefined } });
}

export async function updateHerd(id: string, tenantId: string, data: unknown) {
  const parsed = deerHerdSchema.partial().parse(data);
  return db.deerHerd.update({ where: { id }, data: parsed });
}

export async function deleteHerd(id: string) {
  return db.deerHerd.delete({ where: { id } });
}

// ─── Velvet Records ─────────────────────────────────────────────────────

export async function getVelvetRecords(herdId: string) {
  return db.deerVelvetRecord.findMany({ where: { herdId }, orderBy: { harvestDate: "desc" } });
}

export async function createVelvetRecord(data: unknown) {
  const parsed = deerVelvetRecordSchema.parse(data);
  return db.deerVelvetRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteVelvetRecord(id: string) {
  return db.deerVelvetRecord.delete({ where: { id } });
}

// ─── Venison Records ────────────────────────────────────────────────────

export async function getVenisonRecords(herdId: string) {
  return db.deerVenisonRecord.findMany({ where: { herdId }, orderBy: { date: "desc" } });
}

export async function createVenisonRecord(data: unknown) {
  const parsed = deerVenisonRecordSchema.parse(data);
  return db.deerVenisonRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteVenisonRecord(id: string) {
  return db.deerVenisonRecord.delete({ where: { id } });
}