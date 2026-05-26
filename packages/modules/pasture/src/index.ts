import { z } from "zod";

export const moduleId = "pasture" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const paddockSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  name: z.string().min(1, "Name is required"),
  areaHa: z.number().positive("Area must be positive"),
  soilType: z.string().nullable().optional(),
  grassType: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const paddockRotationSchema = z.object({
  id: z.string().optional(),
  paddockId: z.string().min(1, "Paddock is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().optional(),
  stockType: z.string().nullable().optional(),
  headCount: z.number().int().nullable().optional(),
  comments: z.string().nullable().optional(),
});

export const pastureCoverRecordSchema = z.object({
  id: z.string().optional(),
  paddockId: z.string().min(1, "Paddock is required"),
  date: z.string().min(1, "Date is required"),
  coverKgHa: z.number().positive(),
  method: z.string().nullable().optional(),
  growthRate: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type Paddock = z.infer<typeof paddockSchema>;
export type PaddockRotation = z.infer<typeof paddockRotationSchema>;
export type PastureCoverRecord = z.infer<typeof pastureCoverRecordSchema>;

// ─── Navigation ──────────────────────────────────────────────────────────────

export const navConfig = [
  { label: "Paddocks", href: "/modules/pasture/paddocks", icon: "Trees" },
  { label: "Rotations", href: "/modules/pasture/rotations", icon: "RefreshCw" },
  { label: "Cover Records", href: "/modules/pasture/cover", icon: "Ruler" },
];