import { db } from "@tpt/core";
import type { CreateFieldInput, UpdateFieldInput, CreatePlotInput, UpdatePlotInput } from "./schemas.js";

export async function listFields(tenantId: string) {
  return db.field.findMany({
    where: { tenantId },
    include: { plots: true },
    orderBy: { name: "asc" },
  });
}

export async function getField(tenantId: string, fieldId: string) {
  return db.field.findFirst({
    where: { id: fieldId, tenantId },
    include: { plots: true },
  });
}

export async function createField(tenantId: string, data: CreateFieldInput) {
  return db.field.create({ data: { ...data, tenantId } });
}

export async function updateField(tenantId: string, fieldId: string, data: UpdateFieldInput) {
  return db.field.update({ where: { id: fieldId, tenantId }, data });
}

export async function deleteField(tenantId: string, fieldId: string) {
  return db.field.delete({ where: { id: fieldId, tenantId } });
}

export async function createPlot(data: CreatePlotInput) {
  return db.plot.create({ data });
}

export async function updatePlot(plotId: string, data: UpdatePlotInput) {
  return db.plot.update({ where: { id: plotId }, data });
}

export async function deletePlot(plotId: string) {
  return db.plot.delete({ where: { id: plotId } });
}
