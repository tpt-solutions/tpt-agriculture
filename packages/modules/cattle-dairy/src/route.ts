import { db } from "@tpt/core";
import { dairyCowSchema, dairyMilkRecordSchema, dairyHealthEventSchema } from "./index.js";

// ─── Cows CRUD ────────────────────────────────────────────────────────────

export async function getCows(tenantId: string) {
  return db.dairyCow.findMany({
    where: { tenantId },
    orderBy: { animalId: "asc" },
    include: {
      milkRecords: { orderBy: { date: "desc" }, take: 10 },
      healthEvents: { orderBy: { date: "desc" }, take: 10 },
    },
  });
}

export async function getCow(id: string, tenantId: string) {
  return db.dairyCow.findFirst({ where: { id, tenantId } });
}

export async function createCow(data: unknown) {
  const parsed = dairyCowSchema.parse(data);
  return db.dairyCow.create({ data: { ...parsed, id: undefined } });
}

export async function updateCow(id: string, tenantId: string, data: unknown) {
  const parsed = dairyCowSchema.partial().parse(data);
  return db.dairyCow.update({ where: { id }, data: parsed });
}

export async function deleteCow(id: string, tenantId: string) {
  return db.dairyCow.delete({ where: { id } });
}

// ─── Milk Records CRUD ─────────────────────────────────────────────────────

export async function getMilkRecords(cowId: string) {
  return db.dairyMilkRecord.findMany({
    where: { cowId },
    orderBy: { date: "desc" },
  });
}

export async function createMilkRecord(data: unknown) {
  const parsed = dairyMilkRecordSchema.parse(data);
  return db.dairyMilkRecord.create({ data: { ...parsed, id: undefined } });
}

export async function deleteMilkRecord(id: string) {
  return db.dairyMilkRecord.delete({ where: { id } });
}

// ─── Health Events CRUD ────────────────────────────────────────────────────

export async function getHealthEvents(cowId: string) {
  return db.dairyHealthEvent.findMany({
    where: { cowId },
    orderBy: { date: "desc" },
  });
}

export async function createHealthEvent(data: unknown) {
  const parsed = dairyHealthEventSchema.parse(data);
  return db.dairyHealthEvent.create({ data: { ...parsed, id: undefined } });
}

export async function deleteHealthEvent(id: string) {
  return db.dairyHealthEvent.delete({ where: { id } });
}