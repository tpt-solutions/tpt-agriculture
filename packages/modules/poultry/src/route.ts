import { db } from "@tpt/core";
import { poultryFlockSchema, poultryEggRecordSchema, poultryMortalitySchema } from "./index.js";

// ─── Flocks CRUD ─────────────────────────────────────────────────────────

export async function getFlocks(tenantId: string) {
  return db.poultryFlock.findMany({ where: { tenantId }, orderBy: { housedDate: "desc" } });
}

export async function getFlock(id: string, tenantId: string) {
  return db.poultryFlock.findFirst({ where: { id, tenantId } });
}

export async function createFlock(data: unknown) {
  const parsed = poultryFlockSchema.parse(data);
  return db.poultryFlock.create({ data: { ...parsed, id: undefined } });
}

export async function updateFlock(id: string, tenantId: string, data: unknown) {
  const parsed = poultryFlockSchema.partial().parse(data);
  return db.poultryFlock.update({ where: { id }, data: parsed });
}

export async function deleteFlock(id: string) {
  return db.poultryFlock.delete({ where: { id } });
}

// ─── Egg Records ────────────────────────────────────────────────────────

export async function getEggRecords(flockId: string) {
  return db.poultryEggRecord.findMany({ where: { flockId }, orderBy: { date: "desc" } });
}

export async function createEggRecord(data: unknown) {
  const parsed = poultryEggRecordSchema.parse(data);
  return db.poultryEggRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteEggRecord(id: string) {
  return db.poultryEggRecord.delete({ where: { id } });
}

// ─── Mortality Logs ─────────────────────────────────────────────────────

export async function getMortalityLogs(flockId: string) {
  return db.poultryMortality.findMany({ where: { flockId }, orderBy: { date: "desc" } });
}

export async function createMortalityLog(data: unknown) {
  const parsed = poultryMortalitySchema.parse(data);
  return db.poultryMortality.create({ data: { ...parsed, id: undefined } });
}

export async function deleteMortalityLog(id: string) {
  return db.poultryMortality.delete({ where: { id } });
}