import { db } from "@tpt/core";
import { pigSowSchema, pigLitterSchema, pigFeedRecordSchema } from "./index.js";

// ─── Sows CRUD ───────────────────────────────────────────────────────────

export async function getSows(tenantId: string) {
  return db.pigSow.findMany({ where: { tenantId }, orderBy: { animalId: "asc" } });
}

export async function getSow(id: string, tenantId: string) {
  return db.pigSow.findFirst({ where: { id, tenantId } });
}

export async function createSow(data: unknown) {
  const parsed = pigSowSchema.parse(data);
  return db.pigSow.create({ data: { ...parsed, id: undefined } });
}

export async function updateSow(id: string, tenantId: string, data: unknown) {
  const parsed = pigSowSchema.partial().parse(data);
  return db.pigSow.update({ where: { id }, data: parsed });
}

export async function deleteSow(id: string) {
  return db.pigSow.delete({ where: { id } });
}

// ─── Litters ─────────────────────────────────────────────────────────────

export async function getLitters(sowId: string) {
  return db.pigLitter.findMany({ where: { sowId }, orderBy: { farrowDate: "desc" } });
}

export async function createLitter(data: unknown) {
  const parsed = pigLitterSchema.parse(data);
  return db.pigLitter.create({ data: { ...parsed, id: undefined } });
}

export async function deleteLitter(id: string) {
  return db.pigLitter.delete({ where: { id } });
}

// ─── Feed Records ────────────────────────────────────────────────────────

export async function getFeedRecords(tenantId: string) {
  return db.pigFeedRecord.findMany({ where: { tenantId }, orderBy: { date: "desc" } });
}

export async function createFeedRecord(data: unknown) {
  const parsed = pigFeedRecordSchema.parse(data);
  return db.pigFeedRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteFeedRecord(id: string) {
  return db.pigFeedRecord.delete({ where: { id } });
}