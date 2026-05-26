import { z } from "zod";

export const createMicrogreenBatchSchema = z.object({
  variety: z.string().min(1),
  substrate: z.string().optional(),
  trayCount: z.number().int().positive(),
  traySizeCm: z.string().optional(),
  seedingDate: z.coerce.date(),
  expectedHarvestDate: z.coerce.date().optional(),
  actualHarvestDate: z.coerce.date().optional(),
  yieldGrams: z.number().positive().optional(),
  revenueNzd: z.number().nonnegative().optional(),
  buyer: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMicrogreenBatchSchema = createMicrogreenBatchSchema.partial();

export const createMicrogreenTraySchema = z.object({
  batchId: z.string(),
  trayNumber: z.number().int().positive(),
  yieldGrams: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateMicrogreenTraySchema = createMicrogreenTraySchema.partial().omit({ batchId: true });

export type CreateMicrogreenBatchInput = z.infer<typeof createMicrogreenBatchSchema>;
export type UpdateMicrogreenBatchInput = z.infer<typeof updateMicrogreenBatchSchema>;
export type CreateMicrogreenTrayInput = z.infer<typeof createMicrogreenTraySchema>;
export type UpdateMicrogreenTrayInput = z.infer<typeof updateMicrogreenTraySchema>;
