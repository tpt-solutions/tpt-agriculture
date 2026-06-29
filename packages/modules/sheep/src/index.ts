import { z } from "zod";

export const moduleId = "sheep" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const sheepFlockSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  name: z.string().min(1, "Name is required"),
  breed: z.string().nullable().optional(),
  headCount: z.number().int().positive("Head count must be positive"),
  notes: z.string().nullable().optional(),
});

export const sheepLambingSchema = z.object({
  id: z.string().optional(),
  flockId: z.string().min(1, "Flock is required"),
  season: z.string().min(1, "Season is required"),
  ewesLambed: z.number().int().positive(),
  lambsBorn: z.number().int().positive(),
  lambsAlive: z.number().int(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().nullable().optional(),
});

export const sheepDrenchingSchema = z.object({
  id: z.string().optional(),
  flockId: z.string().min(1, "Flock is required"),
  date: z.string().min(1, "Date is required"),
  product: z.string().min(1, "Product is required"),
  doseMl: z.number().positive().nullable().optional(),
  headCount: z.number().int().positive(),
  withholdingMeat: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const sheepShearingSchema = z.object({
  id: z.string().optional(),
  flockId: z.string().min(1, "Flock is required"),
  date: z.string().min(1, "Date is required"),
  headCount: z.number().int().positive(),
  woolKg: z.number().positive(),
  woolGrade: z.string().nullable().optional(),
  buyer: z.string().nullable().optional(),
  pricePerKg: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type SheepFlock = z.infer<typeof sheepFlockSchema>;
export type SheepLambing = z.infer<typeof sheepLambingSchema>;
export type SheepDrenching = z.infer<typeof sheepDrenchingSchema>;
export type SheepShearing = z.infer<typeof sheepShearingSchema>;

// ─── Navigation ──────────────────────────────────────────────────────────────

export const navConfig = [
  { label: "Flocks", href: "/modules/sheep/flocks", icon: "Users" },
  { label: "Lambing", href: "/modules/sheep/lambing", icon: "Baby" },
  { label: "Drenching", href: "/modules/sheep/drenching", icon: "Syringe" },
  { label: "Shearing", href: "/modules/sheep/shearing", icon: "Scissors" },
];

export * from "./service.js";