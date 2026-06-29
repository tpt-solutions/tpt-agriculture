import { z } from "zod";

export const moduleId = "cattle-beef" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const beefMobSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  name: z.string().min(1, "Name is required"),
  breed: z.string().nullable().optional(),
  headCount: z.number().int().positive("Head count must be positive"),
  location: z.string().nullable().optional(),
  targetWeightKg: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const beefWeightRecordSchema = z.object({
  id: z.string().optional(),
  mobId: z.string().min(1, "Mob is required"),
  date: z.string().min(1, "Date is required"),
  avgWeightKg: z.number().positive("Weight must be positive"),
  sampleCount: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const beefDraftingSchema = z.object({
  id: z.string().optional(),
  mobId: z.string().min(1, "Mob is required"),
  date: z.string().min(1, "Date is required"),
  headCount: z.number().int().positive("Head count must be positive"),
  avgWeightKg: z.number().positive("Weight must be positive"),
  destination: z.enum(["Finished", "Store", "Cull", "Sold"]),
  notes: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type BeefMob = z.infer<typeof beefMobSchema>;
export type BeefWeightRecord = z.infer<typeof beefWeightRecordSchema>;
export type BeefDrafting = z.infer<typeof beefDraftingSchema>;

// ─── Navigation ──────────────────────────────────────────────────────────────

export const navConfig = [
  { label: "Mobs", href: "/modules/cattle-beef/mobs", icon: "Users" },
  { label: "Weight Records", href: "/modules/cattle-beef/weights", icon: "Weight" },
  { label: "Drafting", href: "/modules/cattle-beef/drafting", icon: "ArrowRight" },
];

export * from "./service.js";