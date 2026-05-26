import { z } from "zod";

export const moduleId = "bees" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const beeHiveSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  hiveName: z.string().min(1, "Hive name is required"),
  hiveType: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  queenAge: z.number().int().nullable().optional(),
  queenColor: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LOST", "SPLIT"]).default("ACTIVE"),
  notes: z.string().nullable().optional(),
});

export const beeInspectionSchema = z.object({
  id: z.string().optional(),
  hiveId: z.string().min(1, "Hive is required"),
  date: z.string().min(1, "Date is required"),
  temperament: z.string().nullable().optional(),
  queenSeen: z.boolean().default(true),
  eggsPresent: z.boolean().default(true),
  broodPattern: z.string().nullable().optional(),
  miteCount: z.number().int().nullable().optional(),
  foodStores: z.string().nullable().optional(),
  diseaseSigns: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const beeHoneyHarvestSchema = z.object({
  id: z.string().optional(),
  hiveId: z.string().min(1, "Hive is required"),
  date: z.string().min(1, "Date is required"),
  kg: z.number().positive(),
  type: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  buyer: z.string().nullable().optional(),
  pricePerKg: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type BeeHive = z.infer<typeof beeHiveSchema>;
export type BeeInspection = z.infer<typeof beeInspectionSchema>;
export type BeeHoneyHarvest = z.infer<typeof beeHoneyHarvestSchema>;

// ─── Navigation ──────────────────────────────────────────────────────────────

export const navConfig = [
  { label: "Hives", href: "/modules/bees/hives", icon: "Hexagon" },
  { label: "Inspections", href: "/modules/bees/inspections", icon: "Search" },
  { label: "Honey Harvests", href: "/modules/bees/harvests", icon: "Droplets" },
];