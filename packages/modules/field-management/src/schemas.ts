import { z } from "zod";

export const createFieldSchema = z.object({
  name: z.string().min(1),
  areaHa: z.number().positive(),
  soilType: z.string().optional(),
  irrigationZone: z.string().optional(),
  coordinates: z.unknown().optional(),
  notes: z.string().optional(),
});

export const updateFieldSchema = createFieldSchema.partial();

export const createPlotSchema = z.object({
  fieldId: z.string(),
  name: z.string().min(1),
  row: z.number().int().optional(),
  col: z.number().int().optional(),
  areaSqm: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updatePlotSchema = createPlotSchema.partial().omit({ fieldId: true });

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type CreatePlotInput = z.infer<typeof createPlotSchema>;
export type UpdatePlotInput = z.infer<typeof updatePlotSchema>;
