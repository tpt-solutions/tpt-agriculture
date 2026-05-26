import { z } from "zod";

export const createVitBlockSchema = z.object({
  name: z.string().min(1),
  variety: z.string().min(1),
  areaHa: z.number().positive(),
  rowCount: z.number().int().positive().optional(),
  rootstock: z.string().optional(),
  yearPlanted: z.number().int().optional(),
  trellisSystem: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVitBlockSchema = createVitBlockSchema.partial();

export const createVintageRecordSchema = z.object({
  blockId: z.string(),
  year: z.number().int().min(1900).max(2100),
  brixAtHarvest: z.number().optional(),
  phAtHarvest: z.number().optional(),
  taAtHarvest: z.number().optional(),
  yieldKg: z.number().positive().optional(),
  harvestDate: z.coerce.date().optional(),
  winemaker: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVintageRecordSchema = createVintageRecordSchema.partial().omit({ blockId: true });

export const createCanopyNoteSchema = z.object({
  blockId: z.string(),
  date: z.coerce.date(),
  shootLengthCm: z.number().positive().optional(),
  lateralGrowth: z.string().optional(),
  leafAreaIndex: z.number().positive().optional(),
  observations: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export const updateCanopyNoteSchema = createCanopyNoteSchema.partial().omit({ blockId: true });

export type CreateVitBlockInput = z.infer<typeof createVitBlockSchema>;
export type UpdateVitBlockInput = z.infer<typeof updateVitBlockSchema>;
export type CreateVintageRecordInput = z.infer<typeof createVintageRecordSchema>;
export type UpdateVintageRecordInput = z.infer<typeof updateVintageRecordSchema>;
export type CreateCanopyNoteInput = z.infer<typeof createCanopyNoteSchema>;
export type UpdateCanopyNoteInput = z.infer<typeof updateCanopyNoteSchema>;
