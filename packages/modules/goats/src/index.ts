import { z } from "zod";

export const moduleId = "goats" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const goatHerdSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  name: z.string().min(1, "Name is required"),
  breed: z.string().nullable().optional(),
  headCount: z.number().int().positive(),
  type: z.enum(["DAIRY", "FIBRE", "MEAT", "DUAL"]).default("DAIRY"),
  notes: z.string().nullable().optional(),
});

export const goatMilkRecordSchema = z.object({
  id: z.string().optional(),
  herdId: z.string().min(1, "Herd is required"),
  date: z.string().min(1, "Date is required"),
  liters: z.number().positive(),
  butterfat: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
  comments: z.string().nullable().optional(),
});

export const goatFibreRecordSchema = z.object({
  id: z.string().optional(),
  herdId: z.string().min(1, "Herd is required"),
  date: z.string().min(1, "Date is required"),
  fibreKg: z.number().positive(),
  fibreType: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  buyer: z.string().nullable().optional(),
  pricePerKg: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type GoatHerd = z.infer<typeof goatHerdSchema>;
export type GoatMilkRecord = z.infer<typeof goatMilkRecordSchema>;
export type GoatFibreRecord = z.infer<typeof goatFibreRecordSchema>;

// ─── Navigation ──────────────────────────────────────────────────────────────

export const navConfig = [
  { label: "Herds", href: "/modules/goats/herds", icon: "Users" },
  { label: "Milk Records", href: "/modules/goats/milk", icon: "Droplets" },
  { label: "Fibre Records", href: "/modules/goats/fibre", icon: "Scissors" },
];

export * from "./service.js";