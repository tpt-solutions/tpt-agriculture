import { z } from "zod";

export const createCropPlanSchema = z.object({
  fieldId: z.string().optional(),
  cropVariety: z.string().min(1),
  plannedPlantDate: z.coerce.date(),
  plannedHarvestDate: z.coerce.date().optional(),
  actualPlantDate: z.coerce.date().optional(),
  actualHarvestDate: z.coerce.date().optional(),
  status: z.enum(["PLANNED", "ACTIVE", "HARVESTED", "ABANDONED"]).default("PLANNED"),
  notes: z.string().optional(),
});

export const updateCropPlanSchema = createCropPlanSchema.partial();

export const createPlantingTaskSchema = z.object({
  cropPlanId: z.string(),
  taskType: z.enum(["Sow", "Transplant", "Fertilise", "Irrigate", "Harvest", "Other"]),
  dueDate: z.coerce.date(),
  completedDate: z.coerce.date().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePlantingTaskSchema = createPlantingTaskSchema.partial().omit({ cropPlanId: true });

export type CreateCropPlanInput = z.infer<typeof createCropPlanSchema>;
export type UpdateCropPlanInput = z.infer<typeof updateCropPlanSchema>;
export type CreatePlantingTaskInput = z.infer<typeof createPlantingTaskSchema>;
export type UpdatePlantingTaskInput = z.infer<typeof updatePlantingTaskSchema>;
