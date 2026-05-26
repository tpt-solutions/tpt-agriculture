import { db } from "@tpt/core";
import { sheepFlockSchema, sheepLambingSchema, sheepDrenchingSchema, sheepShearingSchema } from "./index.js";

// ─── Flocks CRUD ─────────────────────────────────────────────────────────

export async function getFlocks(tenantId: string) {
  return db.sheepFlock.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
}

export async function getFlock(id: string, tenantId: string) {
  return db.sheepFlock.findFirst({ where: { id, tenantId } });
}

export async function createFlock(data: unknown) {
  const parsed = sheepFlockSchema.parse(data);
  return db.sheepFlock.create({ data: { ...parsed, id: undefined } });
}

export async function updateFlock(id: string, tenantId: string, data: unknown) {
  const parsed = sheepFlockSchema.partial().parse(data);
  return db.sheepFlock.update({ where: { id }, data: parsed });
}

export async function deleteFlock(id: string) {
  return db.sheepFlock.delete({ where: { id } });
}

// ─── Lambing Records ─────────────────────────────────────────────────────

export async function getLambingRecords(flockId: string) {
  return db.sheepLambing.findMany({ where: { flockId }, orderBy: { date: "desc" } });
}

export async function createLambingRecord(data: unknown) {
  const parsed = sheepLambingSchema.parse(data);
  return db.sheepLambing.create({ data: { ...parsed, id: undefined } });
}

export async function deleteLambingRecord(id: string) {
  return db.sheepLambing.delete({ where: { id } });
}

// ─── Drenching Records ──────────────────────────────────────────────────

export async function getDrenchingRecords(flockId: string) {
  return db.sheepDrenching.findMany({ where: { flockId }, orderBy: { date: "desc" } });
}

export async function createDrenchingRecord(data: unknown) {
  const parsed = sheepDrenchingSchema.parse(data);
  return db.sheepDrenching.create({ data: { ...parsed, id: undefined } });
}

export async function deleteDrenchingRecord(id: string) {
  return db.sheepDrenching.delete({ where: { id } });
}

// ─── Shearing Records ───────────────────────────────────────────────────

export async function getShearingRecords(flockId: string) {
  return db.sheepShearing.findMany({ where: { flockId }, orderBy: { date: "desc" } });
}

export async function createShearingRecord(data: unknown) {
  const parsed = sheepShearingSchema.parse(data);
  return db.sheepShearing.create({ data: { ...parsed, id: undefined } });
}

export async function deleteShearingRecord(id: string) {
  return db.sheepShearing.delete({ where: { id } });
}