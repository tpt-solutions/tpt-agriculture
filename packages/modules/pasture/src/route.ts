import { db } from "@tpt/core";
import { paddockSchema, paddockRotationSchema, pastureCoverRecordSchema } from "./index.js";

// ─── Paddocks CRUD ──────────────────────────────────────────────────────

export async function getPaddocks(tenantId: string) {
  return db.paddock.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
}

export async function getPaddock(id: string, tenantId: string) {
  return db.paddock.findFirst({ where: { id, tenantId } });
}

export async function createPaddock(data: unknown) {
  const parsed = paddockSchema.parse(data);
  return db.paddock.create({ data: { ...parsed, id: undefined } });
}

export async function updatePaddock(id: string, tenantId: string, data: unknown) {
  const parsed = paddockSchema.partial().parse(data);
  return db.paddock.update({ where: { id }, data: parsed });
}

export async function deletePaddock(id: string) {
  return db.paddock.delete({ where: { id } });
}

// ─── Rotations ──────────────────────────────────────────────────────────

export async function getRotations(paddockId: string) {
  return db.paddockRotation.findMany({ where: { paddockId }, orderBy: { startDate: "desc" } });
}

export async function createRotation(data: unknown) {
  const parsed = paddockRotationSchema.parse(data);
  return db.paddockRotation.create({ data: { ...parsed, id: undefined } });
}

export async function updateRotation(id: string, data: unknown) {
  const parsed = paddockRotationSchema.partial().parse(data);
  return db.paddockRotation.update({ where: { id }, data: parsed });
}

export async function deleteRotation(id: string) {
  return db.paddockRotation.delete({ where: { id } });
}

// ─── Cover Records ─────────────────────────────────────────────────────

export async function getCoverRecords(paddockId: string) {
  return db.pastureCoverRecord.findMany({ where: { paddockId }, orderBy: { date: "desc" } });
}

export async function createCoverRecord(data: unknown) {
  const parsed = pastureCoverRecordSchema.parse(data);
  return db.pastureCoverRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteCoverRecord(id: string) {
  return db.pastureCoverRecord.delete({ where: { id } });
}