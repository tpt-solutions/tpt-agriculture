import { eq, and, asc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { fields, plots } from "@tpt/core/schema";
import type { CreateFieldInput, UpdateFieldInput, CreatePlotInput, UpdatePlotInput } from "./schemas.js";

export async function listFields(farmId: string) {
  const db = getDb();
  return db.select().from(fields).where(eq(fields.farmId, farmId)).orderBy(asc(fields.name));
}

export async function getField(farmId: string, fieldId: string) {
  const db = getDb();
  const [field] = await db.select().from(fields)
    .where(and(eq(fields.id, fieldId), eq(fields.farmId, farmId)))
    .limit(1);
  if (!field) return null;
  const fieldPlots = await db.select().from(plots).where(eq(plots.fieldId, fieldId));
  return { ...field, plots: fieldPlots };
}

export async function createField(farmId: string, data: CreateFieldInput) {
  const db = getDb();
  const [row] = await db.insert(fields).values({ ...data, farmId }).returning();
  return row;
}

export async function updateField(farmId: string, fieldId: string, data: UpdateFieldInput) {
  const db = getDb();
  const [row] = await db.update(fields).set(data)
    .where(and(eq(fields.id, fieldId), eq(fields.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteField(farmId: string, fieldId: string) {
  const db = getDb();
  await db.delete(fields).where(and(eq(fields.id, fieldId), eq(fields.farmId, farmId)));
}

export async function createPlot(data: CreatePlotInput) {
  const db = getDb();
  const [row] = await db.insert(plots).values(data).returning();
  return row;
}

export async function updatePlot(plotId: string, data: UpdatePlotInput) {
  const db = getDb();
  const [row] = await db.update(plots).set(data).where(eq(plots.id, plotId)).returning();
  return row;
}

export async function deletePlot(plotId: string) {
  const db = getDb();
  await db.delete(plots).where(eq(plots.id, plotId));
}
