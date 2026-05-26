import { z } from "zod";

export const createHarvestBatchSchema = z.object({
  fieldId: z.string().optional(),
  cropVariety: z.string().min(1),
  harvestDate: z.coerce.date(),
  totalYieldKg: z.number().positive(),
  gradeBreakdown: z.record(z.number()).optional(),
  lotNumber: z.string().optional(),
  buyer: z.string().optional(),
  pricePerKg: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateHarvestBatchSchema = createHarvestBatchSchema.partial();

export const createHarvestRecordSchema = z.object({
  batchId: z.string(),
  plotId: z.string().optional(),
  yieldKg: z.number().positive(),
  grade: z.string().optional(),
  notes: z.string().optional(),
});

export const updateHarvestRecordSchema = createHarvestRecordSchema.partial().omit({ batchId: true });

export type CreateHarvestBatchInput = z.infer<typeof createHarvestBatchSchema>;
export type UpdateHarvestBatchInput = z.infer<typeof updateHarvestBatchSchema>;
export type CreateHarvestRecordInput = z.infer<typeof createHarvestRecordSchema>;
export type UpdateHarvestRecordInput = z.infer<typeof updateHarvestRecordSchema>;
