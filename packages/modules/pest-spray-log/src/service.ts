import { db } from "@tpt/core";
import type { CreateChemicalInput, UpdateChemicalInput, CreateSprayEventInput, UpdateSprayEventInput } from "./schemas.js";

export async function listChemicals(tenantId: string) {
  return db.chemical.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export async function createChemical(tenantId: string, data: CreateChemicalInput) {
  return db.chemical.create({ data: { ...data, tenantId } });
}

export async function updateChemical(tenantId: string, chemicalId: string, data: UpdateChemicalInput) {
  return db.chemical.update({ where: { id: chemicalId, tenantId }, data });
}

export async function deleteChemical(tenantId: string, chemicalId: string) {
  return db.chemical.delete({ where: { id: chemicalId, tenantId } });
}

export async function listSprayEvents(tenantId: string) {
  return db.sprayEvent.findMany({
    where: { tenantId },
    include: {
      chemical: { select: { name: true, withholdingPeriodDays: true } },
      field: { select: { name: true } },
    },
    orderBy: { applicationDate: "desc" },
  });
}

export async function createSprayEvent(tenantId: string, data: CreateSprayEventInput) {
  return db.sprayEvent.create({ data: { ...data, tenantId } });
}

export async function updateSprayEvent(tenantId: string, eventId: string, data: UpdateSprayEventInput) {
  return db.sprayEvent.update({ where: { id: eventId, tenantId }, data });
}

export async function deleteSprayEvent(tenantId: string, eventId: string) {
  return db.sprayEvent.delete({ where: { id: eventId, tenantId } });
}

export async function getActiveWithholdings(tenantId: string) {
  return db.sprayEvent.findMany({
    where: {
      tenantId,
      withholdingEndDate: { gte: new Date() },
    },
    include: {
      chemical: { select: { name: true } },
      field: { select: { name: true } },
    },
    orderBy: { withholdingEndDate: "asc" },
  });
}
