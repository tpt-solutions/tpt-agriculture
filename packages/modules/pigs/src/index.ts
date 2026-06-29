import { z } from "zod";

export const moduleId = "pigs" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const pigSowSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  animalId: z.string().min(1, "Animal ID is required"),
  breed: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  parityCount: z.number().int().default(0),
  status: z.enum(["ACTIVE", "DRY", "SOLD", "DECEASED"]).default("ACTIVE"),
  sire: z.string().nullable().optional(),
});

export const pigLitterSchema = z.object({
  id: z.string().optional(),
  sowId: z.string().min(1, "Sow is required"),
  farrowDate: z.string().min(1, "Farrow date is required"),
  pigletsBorn: z.number().int().positive(),
  pigletsAlive: z.number().int(),
  pigletsWeaned: z.number().int().nullable().optional(),
  weanDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const pigFeedRecordSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  date: z.string().min(1, "Date is required"),
  groupName: z.string().min(1, "Group name is required"),
  headCount: z.number().int().positive(),
  feedType: z.string().min(1, "Feed type is required"),
  feedKg: z.number().positive(),
  costPerKg: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type PigSow = z.infer<typeof pigSowSchema>;
export type PigLitter = z.infer<typeof pigLitterSchema>;
export type PigFeedRecord = z.infer<typeof pigFeedRecordSchema>;

// ─── Navigation ──────────────────────────────────────────────────────────────

export const navConfig = [
  { label: "Sows", href: "/modules/pigs/sows", icon: "PiggyBank" },
  { label: "Litters", href: "/modules/pigs/litters", icon: "Baby" },
  { label: "Feed Records", href: "/modules/pigs/feed", icon: "Wheat" },
];

export * from "./service.js";