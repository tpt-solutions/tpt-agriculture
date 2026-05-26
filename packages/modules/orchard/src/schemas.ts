import { z } from "zod";

export const createOrchardBlockSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  variety: z.string().optional(),
  areaHa: z.number().positive().optional(),
  yearPlanted: z.number().int().optional(),
  rootstock: z.string().optional(),
  pollinatorVariety: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrchardBlockSchema = createOrchardBlockSchema.partial();

export const createTreeInventorySchema = z.object({
  blockId: z.string(),
  treeCount: z.number().int().positive(),
  treeSpacingM: z.number().positive().optional(),
  rowSpacingM: z.number().positive().optional(),
  trainingSystem: z.string().optional(),
  notes: z.string().optional(),
});

export const updateTreeInventorySchema = createTreeInventorySchema.partial().omit({ blockId: true });

export const createHarvestBinSchema = z.object({
  blockId: z.string(),
  harvestDate: z.coerce.date(),
  binCount: z.number().int().positive(),
  weightKg: z.number().positive().optional(),
  grade: z.string().optional(),
  coolstoreId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateHarvestBinSchema = createHarvestBinSchema.partial().omit({ blockId: true });

export type CreateOrchardBlockInput = z.infer<typeof createOrchardBlockSchema>;
export type UpdateOrchardBlockInput = z.infer<typeof updateOrchardBlockSchema>;
export type CreateTreeInventoryInput = z.infer<typeof createTreeInventorySchema>;
export type UpdateTreeInventoryInput = z.infer<typeof updateTreeInventorySchema>;
export type CreateHarvestBinInput = z.infer<typeof createHarvestBinSchema>;
export type UpdateHarvestBinInput = z.infer<typeof updateHarvestBinSchema>;
