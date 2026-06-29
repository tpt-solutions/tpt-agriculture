import { eq, and, asc, desc, lte } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { cropPlans, plantingTasks, fields } from "@tpt/core/schema";
import type { CreateCropPlanInput, UpdateCropPlanInput, CreatePlantingTaskInput, UpdatePlantingTaskInput } from "./schemas.js";

export async function listCropPlans(farmId: string) {
  const db = getDb();
  return db.select().from(cropPlans).where(eq(cropPlans.farmId, farmId)).orderBy(asc(cropPlans.plannedPlantDate));
}

export async function getCropPlan(farmId: string, planId: string) {
  const db = getDb();
  const [plan] = await db.select().from(cropPlans)
    .where(and(eq(cropPlans.id, planId), eq(cropPlans.farmId, farmId)))
    .limit(1);
  if (!plan) return null;
  const tasks = await db.select().from(plantingTasks).where(eq(plantingTasks.cropPlanId, planId)).orderBy(asc(plantingTasks.dueDate));
  const [field] = plan.fieldId
    ? await db.select().from(fields).where(eq(fields.id, plan.fieldId)).limit(1)
    : [null];
  return { ...plan, plantingTasks: tasks, field };
}

export async function createCropPlan(farmId: string, data: CreateCropPlanInput) {
  const db = getDb();
  const [row] = await db.insert(cropPlans).values({ ...data, farmId }).returning();
  return row;
}

export async function updateCropPlan(farmId: string, planId: string, data: UpdateCropPlanInput) {
  const db = getDb();
  const [row] = await db.update(cropPlans).set(data)
    .where(and(eq(cropPlans.id, planId), eq(cropPlans.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteCropPlan(farmId: string, planId: string) {
  const db = getDb();
  await db.delete(cropPlans).where(and(eq(cropPlans.id, planId), eq(cropPlans.farmId, farmId)));
}

export async function createPlantingTask(data: CreatePlantingTaskInput) {
  const db = getDb();
  const [row] = await db.insert(plantingTasks).values(data).returning();
  return row;
}

export async function updatePlantingTask(taskId: string, data: UpdatePlantingTaskInput) {
  const db = getDb();
  const [row] = await db.update(plantingTasks).set(data).where(eq(plantingTasks.id, taskId)).returning();
  return row;
}

export async function deletePlantingTask(taskId: string) {
  const db = getDb();
  await db.delete(plantingTasks).where(eq(plantingTasks.id, taskId));
}

export async function listUpcomingTasks(farmId: string, days = 14) {
  const db = getDb();
  const until = new Date();
  until.setDate(until.getDate() + days);
  return db.select().from(plantingTasks)
    .innerJoin(cropPlans, eq(plantingTasks.cropPlanId, cropPlans.id))
    .where(and(eq(cropPlans.farmId, farmId), lte(plantingTasks.dueDate, until)))
    .orderBy(asc(plantingTasks.dueDate));
}
