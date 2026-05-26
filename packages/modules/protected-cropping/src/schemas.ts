import { z } from "zod";

export const createStructureSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["GREENHOUSE", "POLYTUNNEL", "SHADE_HOUSE", "SCREENHOUSE"]),
  areaSqm: z.number().positive(),
  yearBuilt: z.number().int().optional(),
  roofMaterial: z.string().optional(),
  heatingSystem: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStructureSchema = createStructureSchema.partial();

export const createClimateLogSchema = z.object({
  structureId: z.string(),
  date: z.coerce.date(),
  tempMinC: z.number().optional(),
  tempMaxC: z.number().optional(),
  humidityPct: z.number().min(0).max(100).optional(),
  co2Ppm: z.number().int().nonnegative().optional(),
  lightLux: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export const updateClimateLogSchema = createClimateLogSchema.partial().omit({ structureId: true });

export const createFertigationEventSchema = z.object({
  structureId: z.string(),
  date: z.coerce.date(),
  ec: z.number().positive().optional(),
  ph: z.number().min(0).max(14).optional(),
  nutrients: z.record(z.number()).optional(),
  volumeLitres: z.number().positive().optional(),
  irrigationMins: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const updateFertigationEventSchema = createFertigationEventSchema.partial().omit({ structureId: true });

export type CreateStructureInput = z.infer<typeof createStructureSchema>;
export type UpdateStructureInput = z.infer<typeof updateStructureSchema>;
export type CreateClimateLogInput = z.infer<typeof createClimateLogSchema>;
export type UpdateClimateLogInput = z.infer<typeof updateClimateLogSchema>;
export type CreateFertigationEventInput = z.infer<typeof createFertigationEventSchema>;
export type UpdateFertigationEventInput = z.infer<typeof updateFertigationEventSchema>;
