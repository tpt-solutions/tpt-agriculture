import { z } from "zod";

export const moduleId = "deer" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const deerHerdSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  name: z.string().min(1, "Name is required"),
  species: z.string().nullable().optional(),
  headCount: z.number().int().positive(),
  notes: z.string().nullable().optional(),
});

export const deerVelvetRecordSchema = z.object({
  id: z.string().optional(),
  herdId: z.string().min(1, "Herd is required"),
  stagId: z.string().nullable().optional(),
  harvestDate: z.string().min(1, "Date is required"),
  velvetKg: z.number().positive(),
  grade: z.string().nullable().optional(),
  buyer: z.string().nullable().optional(),
  pricePerKg: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const deerVenisonRecordSchema = z.object({
  id: z.string().optional(),
  herdId: z.string().min(1, "Herd is required"),
  date: z.string().min(1, "Date is required"),
  headCount: z.number().int().positive(),
  carcassKg: z.number().positive(),
  grade: z.string().nullable().optional(),
  buyer: z.string().nullable().optional(),
  pricePerKg: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type DeerHerd = z.infer<typeof deerHerdSchema>;
export type DeerVelvetRecord = z.infer<typeof deerVelvetRecordSchema>;
export type DeerVenisonRecord = z.infer<typeof deerVenisonRecordSchema>;

// ─── Navigation ──────────────────────────────────────────────────────────────

export const navConfig = [
  { label: "Herds", href: "/modules/deer/herds", icon: "Users" },
  { label: "Velvet Harvests", href: "/modules/deer/velvet", icon: "Award" },
  { label: "Venison", href: "/modules/deer/venison", icon: "Beef" },
];

export * from "./service.js";