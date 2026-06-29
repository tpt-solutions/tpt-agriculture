import { z } from "zod";

export const moduleId = "poultry" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const poultryFlockSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  batchName: z.string().min(1, "Batch name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().nullable().optional(),
  birdCount: z.number().int().positive(),
  housedDate: z.string().min(1, "Housed date is required"),
  house: z.string().nullable().optional(),
  purpose: z.enum(["MEAT", "EGGS", "DUAL"]),
  status: z.enum(["ACTIVE", "PROCESSED", "DEPLETED"]).default("ACTIVE"),
  notes: z.string().nullable().optional(),
});

export const poultryEggRecordSchema = z.object({
  id: z.string().optional(),
  flockId: z.string().min(1, "Flock is required"),
  date: z.string().min(1, "Date is required"),
  eggCount: z.number().int().positive(),
  grade: z.string().nullable().optional(),
  cracked: z.number().int().default(0),
  comments: z.string().nullable().optional(),
});

export const poultryMortalitySchema = z.object({
  id: z.string().optional(),
  flockId: z.string().min(1, "Flock is required"),
  date: z.string().min(1, "Date is required"),
  count: z.number().int().positive(),
  cause: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type PoultryFlock = z.infer<typeof poultryFlockSchema>;
export type PoultryEggRecord = z.infer<typeof poultryEggRecordSchema>;
export type PoultryMortality = z.infer<typeof poultryMortalitySchema>;

// ─── Navigation ──────────────────────────────────────────────────────────────

export const navConfig = [
  { label: "Flocks", href: "/modules/poultry/flocks", icon: "Bird" },
  { label: "Egg Production", href: "/modules/poultry/eggs", icon: "Egg" },
  { label: "Mortality", href: "/modules/poultry/mortality", icon: "HeartPulse" },
];

export * from "./service.js";