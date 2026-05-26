import { db } from "@tpt/core";
import { goatHerdSchema, goatMilkRecordSchema, goatFibreRecordSchema } from "./index.js";

// ─── Herds CRUD ──────────────────────────────────────────────────────────

export async function getHerds(tenantId: string) {
  return db.goatHerd.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
}

export async function getHerd(id: string, tenantId: string) {
  return db.goatHerd.findFirst({ where: { id, tenantId } });
}

export async function createHerd(data: unknown) {
  const parsed = goatHerdSchema.parse(data);
  return db.goatHerd.create({ data: { ...parsed, id: undefined } });
}

export async function updateHerd(id: string, tenantId: string, data: unknown) {
  const parsed = goatHerdSchema.partial().parse(data);
  return db.goatHerd.update({ where: { id }, data: parsed });
}

export async function deleteHerd(id: string) {
  return db.goatHerd.delete({ where: { id } });
}

// ─── Milk Records ────────────────────────────────────────────────────────

export async function getMilkRecords(herdId: string) {
  return db.goatMilkRecord.findMany({ where: { herdId }, orderBy: { date: "desc" } });
}

export async function createMilkRecord(data: unknown) {
  const parsed = goatMilkRecordSchema.parse(data);
  return db.goatMilkRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteMilkRecord(id: string) {
  return db.goatMilkRecord.delete({ where: { id } });
}

// ─── Fibre Records ──────────────────────────────────────────────────────

export async function getFibreRecords(herdId: string) {
  return db.goatFibreRecord.findMany({ where: { herdId }, orderBy: { date: "desc" } });
}

export async function createFibreRecord(data: unknown) {
  const parsed = goatFibreRecordSchema.parse(data);
  return db.goatFibreRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteFibreRecord(id: string) {
  return db.goatFibreRecord.delete({ where: { id } });
}