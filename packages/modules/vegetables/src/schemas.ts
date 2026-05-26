import { z } from "zod";

export const createVegBedSchema = z.object({
  name: z.string().min(1),
  lengthM: z.number().positive().optional(),
  widthM: z.number().positive().optional(),
  indoor: z.boolean().default(false),
  soilMix: z.string().optional(),
  irrigationType: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVegBedSchema = createVegBedSchema.partial();

export const createVegSuccessionSchema = z.object({
  bedId: z.string(),
  cropVariety: z.string().min(1),
  plantDate: z.coerce.date(),
  transplantDate: z.coerce.date().optional(),
  expectedHarvestDate: z.coerce.date().optional(),
  actualHarvestDate: z.coerce.date().optional(),
  yieldKg: z.number().positive().optional(),
  seedSource: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVegSuccessionSchema = createVegSuccessionSchema.partial().omit({ bedId: true });

export type CreateVegBedInput = z.infer<typeof createVegBedSchema>;
export type UpdateVegBedInput = z.infer<typeof updateVegBedSchema>;
export type CreateVegSuccessionInput = z.infer<typeof createVegSuccessionSchema>;
export type UpdateVegSuccessionInput = z.infer<typeof updateVegSuccessionSchema>;
