import { z } from "zod";

export const createAquaSystemSchema = z.object({
  name: z.string().min(1),
  systemType: z.enum(["NFT", "DWC", "Media_Bed", "Raft", "Hybrid"]),
  fishTankLitres: z.number().positive().optional(),
  growBedSqm: z.number().positive().optional(),
  pumpFlowLph: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateAquaSystemSchema = createAquaSystemSchema.partial();

export const createFishStockSchema = z.object({
  systemId: z.string(),
  species: z.string().min(1),
  stockCount: z.number().int().positive(),
  averageWeightG: z.number().positive().optional(),
  stockDate: z.coerce.date(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const updateFishStockSchema = createFishStockSchema.partial().omit({ systemId: true });

export const createWaterQualityLogSchema = z.object({
  systemId: z.string(),
  date: z.coerce.date(),
  ph: z.number().min(0).max(14).optional(),
  ammoniaMgl: z.number().nonnegative().optional(),
  nitriteMgl: z.number().nonnegative().optional(),
  nitrateMgl: z.number().nonnegative().optional(),
  doMgl: z.number().nonnegative().optional(),
  tempC: z.number().optional(),
  notes: z.string().optional(),
});

export const updateWaterQualityLogSchema = createWaterQualityLogSchema.partial().omit({ systemId: true });

export const createFeedingEventSchema = z.object({
  systemId: z.string(),
  date: z.coerce.date(),
  feedType: z.string().optional(),
  amountG: z.number().positive(),
  notes: z.string().optional(),
});

export const createPlantYieldSchema = z.object({
  systemId: z.string(),
  date: z.coerce.date(),
  cropVariety: z.string().min(1),
  yieldGrams: z.number().positive(),
  bed: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateAquaSystemInput = z.infer<typeof createAquaSystemSchema>;
export type UpdateAquaSystemInput = z.infer<typeof updateAquaSystemSchema>;
export type CreateFishStockInput = z.infer<typeof createFishStockSchema>;
export type UpdateFishStockInput = z.infer<typeof updateFishStockSchema>;
export type CreateWaterQualityLogInput = z.infer<typeof createWaterQualityLogSchema>;
export type UpdateWaterQualityLogInput = z.infer<typeof updateWaterQualityLogSchema>;
export type CreateFeedingEventInput = z.infer<typeof createFeedingEventSchema>;
export type CreatePlantYieldInput = z.infer<typeof createPlantYieldSchema>;
