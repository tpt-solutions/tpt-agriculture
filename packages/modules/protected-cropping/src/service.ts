import { db } from "@tpt/core";
import type { CreateStructureInput, UpdateStructureInput, CreateClimateLogInput, UpdateClimateLogInput, CreateFertigationEventInput, UpdateFertigationEventInput } from "./schemas.js";

export async function listStructures(tenantId: string) {
  return db.structure.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export async function getStructure(tenantId: string, structureId: string) {
  return db.structure.findFirst({
    where: { id: structureId, tenantId },
    include: {
      climateLogs: { orderBy: { date: "desc" }, take: 30 },
      fertigationEvents: { orderBy: { date: "desc" }, take: 20 },
    },
  });
}

export async function createStructure(tenantId: string, data: CreateStructureInput) {
  return db.structure.create({ data: { ...data, tenantId } });
}

export async function updateStructure(tenantId: string, structureId: string, data: UpdateStructureInput) {
  return db.structure.update({ where: { id: structureId, tenantId }, data });
}

export async function deleteStructure(tenantId: string, structureId: string) {
  return db.structure.delete({ where: { id: structureId, tenantId } });
}

export async function createClimateLog(data: CreateClimateLogInput) {
  return db.climateLog.create({ data });
}

export async function updateClimateLog(logId: string, data: UpdateClimateLogInput) {
  return db.climateLog.update({ where: { id: logId }, data });
}

export async function deleteClimateLog(logId: string) {
  return db.climateLog.delete({ where: { id: logId } });
}

export async function createFertigationEvent(data: CreateFertigationEventInput) {
  return db.fertigationEvent.create({ data });
}

export async function updateFertigationEvent(eventId: string, data: UpdateFertigationEventInput) {
  return db.fertigationEvent.update({ where: { id: eventId }, data });
}

export async function deleteFertigationEvent(eventId: string) {
  return db.fertigationEvent.delete({ where: { id: eventId } });
}
