import { db } from "@tpt/core";
import type { CreateCropPlanInput, UpdateCropPlanInput, CreatePlantingTaskInput, UpdatePlantingTaskInput } from "./schemas.js";

export async function listCropPlans(tenantId: string) {
  return db.cropPlan.findMany({
    where: { tenantId },
    include: { plantingTasks: { orderBy: { dueDate: "asc" } } },
    orderBy: { plannedPlantDate: "asc" },
  });
}

export async function getCropPlan(tenantId: string, planId: string) {
  return db.cropPlan.findFirst({
    where: { id: planId, tenantId },
    include: { plantingTasks: { orderBy: { dueDate: "asc" } }, field: true },
  });
}

export async function createCropPlan(tenantId: string, data: CreateCropPlanInput) {
  return db.cropPlan.create({ data: { ...data, tenantId } });
}

export async function updateCropPlan(tenantId: string, planId: string, data: UpdateCropPlanInput) {
  return db.cropPlan.update({ where: { id: planId, tenantId }, data });
}

export async function deleteCropPlan(tenantId: string, planId: string) {
  return db.cropPlan.delete({ where: { id: planId, tenantId } });
}

export async function createPlantingTask(data: CreatePlantingTaskInput) {
  return db.plantingTask.create({ data });
}

export async function updatePlantingTask(taskId: string, data: UpdatePlantingTaskInput) {
  return db.plantingTask.update({ where: { id: taskId }, data });
}

export async function deletePlantingTask(taskId: string) {
  return db.plantingTask.delete({ where: { id: taskId } });
}

export async function listUpcomingTasks(tenantId: string, days = 14) {
  const until = new Date();
  until.setDate(until.getDate() + days);
  return db.plantingTask.findMany({
    where: {
      cropPlan: { tenantId },
      completedDate: null,
      dueDate: { lte: until },
    },
    include: { cropPlan: true },
    orderBy: { dueDate: "asc" },
  });
}
