import { z } from "zod";

export const moduleId = "cattle-dairy" as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const dairyCowSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  animalId: z.string().min(1, "Animal ID is required"),
  breed: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  sex: z.enum(["FEMALE", "MALE"]).default("FEMALE"),
  currentStatus: z
    .enum(["LACTATING", "DRY", "SOLD", "DECEASED"])
    .default("LACTATING"),
  calvingCount: z.number().int().default(0),
  lastCalvingDate: z.string().nullable().optional(),
  sire: z.string().nullable().optional(),
  dam: z.string().nullable().optional(),
});

export const dairyMilkRecordSchema = z.object({
  id: z.string().optional(),
  cowId: z.string().min(1, "Cow is required"),
  date: z.string().min(1, "Date is required"),
  liters: z.number().positive("Liters must be positive"),
  fatPct: z.number().nullable().optional(),
  proteinPct: z.number().nullable().optional(),
  scc: z.number().int().nullable().optional(),
  comments: z.string().nullable().optional(),
});

export const dairyHealthEventSchema = z.object({
  id: z.string().optional(),
  cowId: z.string().min(1, "Cow is required"),
  date: z.string().min(1, "Date is required"),
  eventType: z.enum([
    "DryingOff",
    "MastitisTreatment",
    "Vaccination",
    "VetVisit",
    "Other",
  ]),
  description: z.string().min(1, "Description is required"),
  withdrawn: z.boolean().default(false),
  withdrawnUntil: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type DairyCow = z.infer<typeof dairyCowSchema>;
export type DairyMilkRecord = z.infer<typeof dairyMilkRecordSchema>;
export type DairyHealthEvent = z.infer<typeof dairyHealthEventSchema>;

// ─── Navigation Config ───────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export const navConfig: NavItem[] = [
  { label: "Cows", href: "/modules/cattle-dairy/cows", icon: "Cow" },
  { label: "Milk Records", href: "/modules/cattle-dairy/milk", icon: "Droplets" },
  { label: "Health Events", href: "/modules/cattle-dairy/health", icon: "HeartPulse" },
];