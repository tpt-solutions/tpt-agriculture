import { z } from "zod";

export const createChemicalSchema = z.object({
  name: z.string().min(1),
  activeIngredient: z.string().optional(),
  registrationNo: z.string().optional(),
  withholdingPeriodDays: z.number().int().nonnegative().optional(),
  safetyNotes: z.string().optional(),
  hazardClass: z.string().optional(),
});

export const updateChemicalSchema = createChemicalSchema.partial();

export const createSprayEventSchema = z.object({
  fieldId: z.string().optional(),
  chemicalId: z.string().optional(),
  applicationDate: z.coerce.date(),
  ratePerHa: z.number().positive().optional(),
  totalVolumeLitres: z.number().positive().optional(),
  operator: z.string().optional(),
  weatherConditions: z.string().optional(),
  windSpeedKph: z.number().nonnegative().optional(),
  tempC: z.number().optional(),
  withholdingEndDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateSprayEventSchema = createSprayEventSchema.partial();

export type CreateChemicalInput = z.infer<typeof createChemicalSchema>;
export type UpdateChemicalInput = z.infer<typeof updateChemicalSchema>;
export type CreateSprayEventInput = z.infer<typeof createSprayEventSchema>;
export type UpdateSprayEventInput = z.infer<typeof updateSprayEventSchema>;
