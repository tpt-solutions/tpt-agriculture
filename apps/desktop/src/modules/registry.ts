// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { eq, and, asc, desc, inArray, getTableName } from "drizzle-orm";
import { getDb, MODULE_REGISTRY, resolveCountryProfile, TRACEABILITY_SCHEMES } from "@tpt/core";
import * as schema from "@tpt/core/schema";
import type { ModuleAdapter, ColumnDef, FormFieldDef } from "./module-adapter.js";

/** Enterprise dropdown for tagging ledger entries — horticulture/livestock module ids only. */
const ENTERPRISE_OPTIONS = Object.entries(MODULE_REGISTRY)
  .filter(([, meta]) => meta.category === "horticulture" || meta.category === "livestock")
  .map(([id, meta]) => ({ value: id, label: meta.name }));
const ENTERPRISE_LABELS: Record<string, string> = Object.fromEntries(
  ENTERPRISE_OPTIONS.map((o) => [o.value, o.label])
);

/** Species eligible for a traceability movement record — livestock modules that
 * carry individually-identifiable animals/mobs. Excludes bees and pasture, which
 * are also "livestock" category but aren't subject to NAIT/NLIS-style schemes. */
const TRACEABLE_SPECIES_IDS = ["cattle-dairy", "cattle-beef", "sheep", "goats", "deer", "pigs", "poultry"];
const TRACEABLE_SPECIES_OPTIONS = TRACEABLE_SPECIES_IDS.map((id) => ({ value: id, label: MODULE_REGISTRY[id]!.name }));
const TRACEABLE_SPECIES_LABELS: Record<string, string> = Object.fromEntries(
  TRACEABLE_SPECIES_OPTIONS.map((o) => [o.value, o.label])
);

/**
 * Create locale-aware date formatter
 * @param locale - The locale to use for formatting (e.g., "en-NZ", "en-US")
 * @returns A formatter function for dates
 */
function createDateFormatter(locale: string | undefined) {
  const formatter = locale ? new Intl.DateTimeFormat(locale) : undefined;
  return (v: unknown): string => {
    if (!v) return "";
    let date: Date;
    if (v instanceof Date) date = v;
    else if (typeof v === "number") date = new Date(v);
    else return String(v);
    return formatter ? formatter.format(date) : date.toLocaleDateString();
  };
}

/**
 * Create locale-aware number formatter
 * @param locale - The locale to use for formatting (e.g., "en-NZ", "en-US")
 * @returns A formatter function for numbers
 */
function createNumberFormatter(locale: string | undefined) {
  const formatter = locale ? new Intl.NumberFormat(locale) : undefined;
  return (v: unknown): string => {
    if (v == null) return "";
    const num = Number(v);
    return formatter ? formatter.format(num) : num.toLocaleString();
  };
}

/**
 * Create column formatters with the given locale
 * This is called from use-module-query to get locale-aware adapters
 */
export function createColumnFormatters(locale: string | undefined) {
  return {
    fmtDate: createDateFormatter(locale),
    fmtNum: createNumberFormatter(locale),
  };
}

/**
 * Builds a "child" ModuleAdapter for a transactional/event sub-table that belongs
 * to a parent record (e.g. a Sheep flock's lambing records). The parent is picked
 * via a live `foreignKey` dropdown driven by the parent module's own adapter, so
 * the whole thing is farm-scoped without the child table needing its own farmId
 * column. Reused across ~30 sub-tables that were defined in the schema but had no
 * UI wired up at all (Phase 18).
 */
function makeChildAdapter(cfg: {
  moduleId: string;
  label: string;
  table: any;
  parentTable: any;
  parentIdField: string;
  parentLabel: string;
  parentLabelField: string;
  parentOptionsModuleId: string;
  dateField?: string;
  columns: ColumnDef[];
  formFields: FormFieldDef[];
}): ModuleAdapter {
  const { table, parentTable } = cfg;
  const parentIdCol = (table as Record<string, any>)[cfg.parentIdField];
  const parentPk = parentTable.id;
  const parentFarmIdCol = parentTable.farmId;
  const parentLabelCol = (parentTable as Record<string, any>)[cfg.parentLabelField];

  return {
    moduleId: cfg.moduleId,
    label: cfg.label,
    primaryTable: getTableName(table),
    columns: [{ key: "_parentLabel", label: cfg.parentLabel }, ...cfg.columns],
    formFields: [
      {
        key: cfg.parentIdField,
        label: cfg.parentLabel,
        type: "select",
        required: true,
        foreignKey: { moduleId: cfg.parentOptionsModuleId, labelField: cfg.parentLabelField },
      },
      ...cfg.formFields,
    ],
    list: async (farmId) => {
      const db = await getDb();
      const parents = (await db
        .select({ id: parentPk, label: parentLabelCol })
        .from(parentTable)
        .where(eq(parentFarmIdCol, farmId))) as unknown as { id: string; label: unknown }[];
      if (parents.length === 0) return [] as Record<string, unknown>[];
      const parentMap = new Map(parents.map((p) => [p.id, p.label]));
      const rows = (await db
        .select()
        .from(table)
        .where(inArray(parentIdCol, parents.map((p) => p.id)))) as unknown as Record<string, unknown>[];
      const withLabel: Record<string, unknown>[] = rows.map((row) => ({
        ...row,
        _parentLabel: parentMap.get(row[cfg.parentIdField] as string) ?? "—",
      }));
      if (cfg.dateField) {
        const dateField = cfg.dateField;
        withLabel.sort((a, b) => {
          const da = a[dateField] instanceof Date ? (a[dateField] as Date).getTime() : 0;
          const dbv = b[dateField] instanceof Date ? (b[dateField] as Date).getTime() : 0;
          return dbv - da;
        });
      }
      return withLabel;
    },
    create: async (_farmId, data) => {
      const db = await getDb();
      const [row] = (await db.insert(table).values(data as any).returning()) as any[];
      return row as Record<string, unknown>;
    },
    update: async (_farmId, id, data) => {
      const db = await getDb();
      const [row] = (await db.update(table).set(data).where(eq(table.id, id)).returning()) as any[];
      return row as Record<string, unknown>;
    },
    delete: async (_farmId, id) => {
      const db = await getDb();
      await db.delete(table).where(eq(table.id, id));
    },
  };
}

export const MODULE_ADAPTERS: Record<string, ModuleAdapter> = {
  "field-management": {
    moduleId: "field-management",
    label: "Fields",
    primaryTable: "fields",
    columns: [
      { key: "name", label: "Name" },
      { key: "areaHa", label: "Area (ha)", type: "number" },
      { key: "soilType", label: "Soil Type" },
      { key: "irrigationZone", label: "Irrigation Zone" },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "areaHa", label: "Area (ha)", type: "number", required: true },
      { key: "soilType", label: "Soil Type", type: "select", optionsKey: "soil-type" },
      { key: "irrigationZone", label: "Irrigation Zone", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.fields).where(eq(schema.fields.farmId, farmId)).orderBy(asc(schema.fields.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.fields).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.fields).set(data).where(and(eq(schema.fields.id, id), eq(schema.fields.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.fields).where(and(eq(schema.fields.id, id), eq(schema.fields.farmId, farmId))); },
  },

  "crop-planning": {
    moduleId: "crop-planning",
    label: "Crop Plans",
    primaryTable: "crop_plans",
    columns: [
      { key: "cropVariety", label: "Crop / Variety" },
      { key: "plannedPlantDate", label: "Plant Date", type: "date" },
      { key: "plannedHarvestDate", label: "Harvest Date", type: "date" },
      { key: "status", label: "Status" },
    ],
    formFields: [
      { key: "cropVariety", label: "Crop / Variety", type: "select", optionsKey: "crop-variety", required: true },
      { key: "plannedPlantDate", label: "Planned Plant Date", type: "date", required: true },
      { key: "plannedHarvestDate", label: "Planned Harvest Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: [{ value: "PLANNED", label: "Planted" }, { value: "IN_PROGRESS", label: "In Progress" }, { value: "COMPLETED", label: "Completed" }] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.cropPlans).where(eq(schema.cropPlans.farmId, farmId)).orderBy(asc(schema.cropPlans.plannedPlantDate)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.cropPlans).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.cropPlans).set(data).where(and(eq(schema.cropPlans.id, id), eq(schema.cropPlans.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.cropPlans).where(and(eq(schema.cropPlans.id, id), eq(schema.cropPlans.farmId, farmId))); },
  },

  "harvest-tracking": {
    moduleId: "harvest-tracking",
    label: "Harvest Batches",
    primaryTable: "harvest_batches",
    columns: [
      { key: "cropVariety", label: "Crop" },
      { key: "harvestDate", label: "Date", type: "date" },
      { key: "totalYieldKg", label: "Yield (kg)", type: "number" },
      { key: "lotNumber", label: "Lot #" },
      { key: "buyer", label: "Buyer" },
    ],
    formFields: [
      { key: "cropVariety", label: "Crop / Variety", type: "select", optionsKey: "crop-variety", required: true },
      { key: "harvestDate", label: "Harvest Date", type: "date", required: true },
      { key: "totalYieldKg", label: "Total Yield (kg)", type: "number", required: true },
      { key: "lotNumber", label: "Lot Number", type: "text" },
      { key: "buyer", label: "Buyer", type: "text" },
      { key: "pricePerKg", label: "Price per kg", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.harvestBatches).where(eq(schema.harvestBatches.farmId, farmId)).orderBy(desc(schema.harvestBatches.harvestDate)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.harvestBatches).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.harvestBatches).set(data).where(and(eq(schema.harvestBatches.id, id), eq(schema.harvestBatches.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.harvestBatches).where(and(eq(schema.harvestBatches.id, id), eq(schema.harvestBatches.farmId, farmId))); },
  },

  // Note: pest-spray-log columns use dynamic labels (see getLocaleAwareAdapter below)
  "pest-spray-log": {
    moduleId: "pest-spray-log",
    label: "Chemicals",
    primaryTable: "chemicals",
    columns: [
      { key: "name", label: "Name" },
      { key: "activeIngredient", label: "Active Ingredient" },
      { key: "registrationNo", label: "Reg #" },
      { key: "withholdingPeriodDays", label: "WHP (days)", type: "number" },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "activeIngredient", label: "Active Ingredient", type: "text" },
      { key: "registrationNo", label: "Registration #", type: "text" },
      { key: "withholdingPeriodDays", label: "Withholding Period (days)", type: "number" },
      { key: "safetyNotes", label: "Safety Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.chemicals).where(eq(schema.chemicals.farmId, farmId)).orderBy(asc(schema.chemicals.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.chemicals).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.chemicals).set(data).where(and(eq(schema.chemicals.id, id), eq(schema.chemicals.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.chemicals).where(and(eq(schema.chemicals.id, id), eq(schema.chemicals.farmId, farmId))); },
  },

  viticulture: {
    moduleId: "viticulture",
    label: "Vineyard Blocks",
    primaryTable: "vit_blocks",
    columns: [
      { key: "name", label: "Block" },
      { key: "variety", label: "Variety" },
      { key: "areaHa", label: "Area (ha)", type: "number" },
      { key: "yearPlanted", label: "Year Planted", type: "number" },
    ],
    formFields: [
      { key: "name", label: "Block Name", type: "text", required: true },
      { key: "variety", label: "Variety", type: "select", optionsKey: "grape-variety", required: true },
      { key: "areaHa", label: "Area (ha)", type: "number", required: true },
      { key: "rowCount", label: "Row Count", type: "number" },
      { key: "rootstock", label: "Rootstock", type: "text" },
      { key: "yearPlanted", label: "Year Planted", type: "number" },
      { key: "trellisSystem", label: "Trellis System", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.vitBlocks).where(eq(schema.vitBlocks.farmId, farmId)).orderBy(asc(schema.vitBlocks.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.vitBlocks).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.vitBlocks).set(data).where(and(eq(schema.vitBlocks.id, id), eq(schema.vitBlocks.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.vitBlocks).where(and(eq(schema.vitBlocks.id, id), eq(schema.vitBlocks.farmId, farmId))); },
  },

  orchard: {
    moduleId: "orchard",
    label: "Orchard Blocks",
    primaryTable: "orchard_blocks",
    columns: [
      { key: "name", label: "Block" },
      { key: "species", label: "Species" },
      { key: "variety", label: "Variety" },
      { key: "areaHa", label: "Area (ha)", type: "number" },
    ],
    formFields: [
      { key: "name", label: "Block Name", type: "text", required: true },
      { key: "species", label: "Species", type: "select", optionsKey: "orchard-species", required: true },
      { key: "variety", label: "Variety", type: "select", optionsKey: "orchard-variety" },
      { key: "areaHa", label: "Area (ha)", type: "number" },
      { key: "yearPlanted", label: "Year Planted", type: "number" },
      { key: "rootstock", label: "Rootstock", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.orchardBlocks).where(eq(schema.orchardBlocks.farmId, farmId)).orderBy(asc(schema.orchardBlocks.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.orchardBlocks).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.orchardBlocks).set(data).where(and(eq(schema.orchardBlocks.id, id), eq(schema.orchardBlocks.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.orchardBlocks).where(and(eq(schema.orchardBlocks.id, id), eq(schema.orchardBlocks.farmId, farmId))); },
  },

  vegetables: {
    moduleId: "vegetables",
    label: "Veg Beds",
    primaryTable: "veg_beds",
    columns: [
      { key: "name", label: "Bed" },
      { key: "lengthM", label: "Length (m)", type: "number" },
      { key: "widthM", label: "Width (m)", type: "number" },
      { key: "indoor", label: "Indoor", type: "boolean" },
    ],
    formFields: [
      { key: "name", label: "Bed Name", type: "text", required: true },
      { key: "lengthM", label: "Length (m)", type: "number" },
      { key: "widthM", label: "Width (m)", type: "number" },
      { key: "indoor", label: "Indoor", type: "select", boolean: true, options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
      { key: "soilMix", label: "Soil Mix", type: "text" },
      { key: "irrigationType", label: "Irrigation Type", type: "select", optionsKey: "irrigation-type" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.vegBeds).where(eq(schema.vegBeds.farmId, farmId)).orderBy(asc(schema.vegBeds.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.vegBeds).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.vegBeds).set(data).where(and(eq(schema.vegBeds.id, id), eq(schema.vegBeds.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.vegBeds).where(and(eq(schema.vegBeds.id, id), eq(schema.vegBeds.farmId, farmId))); },
  },

  microgreens: {
    moduleId: "microgreens",
    label: "Microgreen Batches",
    primaryTable: "microgreen_batches",
    columns: [
      { key: "variety", label: "Variety" },
      { key: "seedingDate", label: "Seeded", type: "date" },
      { key: "trayCount", label: "Trays", type: "number" },
      { key: "yieldGrams", label: "Yield (g)", type: "number" },
    ],
    formFields: [
      { key: "variety", label: "Variety", type: "select", optionsKey: "microgreens-variety", required: true },
      { key: "substrate", label: "Substrate", type: "text" },
      { key: "trayCount", label: "Tray Count", type: "number", required: true },
      { key: "traySizeCm", label: "Tray Size (cm)", type: "text" },
      { key: "seedingDate", label: "Seeding Date", type: "date", required: true },
      { key: "expectedHarvestDate", label: "Expected Harvest", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.microgreenBatches).where(eq(schema.microgreenBatches.farmId, farmId)).orderBy(desc(schema.microgreenBatches.seedingDate)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.microgreenBatches).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.microgreenBatches).set(data).where(and(eq(schema.microgreenBatches.id, id), eq(schema.microgreenBatches.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.microgreenBatches).where(and(eq(schema.microgreenBatches.id, id), eq(schema.microgreenBatches.farmId, farmId))); },
  },

  "protected-cropping": {
    moduleId: "protected-cropping",
    label: "Structures",
    primaryTable: "structures",
    columns: [
      { key: "name", label: "Structure" },
      { key: "type", label: "Type" },
      { key: "areaSqm", label: "Area (m²)", type: "number" },
      { key: "yearBuilt", label: "Year Built", type: "number" },
    ],
    formFields: [
      { key: "name", label: "Structure Name", type: "text", required: true },
      { key: "type", label: "Type", type: "text", required: true },
      { key: "areaSqm", label: "Area (m²)", type: "number", required: true },
      { key: "yearBuilt", label: "Year Built", type: "number" },
      { key: "roofMaterial", label: "Roof Material", type: "text" },
      { key: "heatingSystem", label: "Heating System", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.structures).where(eq(schema.structures.farmId, farmId)).orderBy(asc(schema.structures.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.structures).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.structures).set(data).where(and(eq(schema.structures.id, id), eq(schema.structures.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.structures).where(and(eq(schema.structures.id, id), eq(schema.structures.farmId, farmId))); },
  },

  aquaponics: {
    moduleId: "aquaponics",
    label: "Systems",
    primaryTable: "aqua_systems",
    columns: [
      { key: "name", label: "System" },
      { key: "systemType", label: "Type" },
      { key: "fishTankLitres", label: "Tank (L)", type: "number" },
      { key: "growBedSqm", label: "Grow Bed (m²)", type: "number" },
    ],
    formFields: [
      { key: "name", label: "System Name", type: "text", required: true },
      { key: "systemType", label: "Type", type: "text", required: true },
      { key: "fishTankLitres", label: "Fish Tank (litres)", type: "number" },
      { key: "growBedSqm", label: "Grow Bed (m²)", type: "number" },
      { key: "pumpFlowLph", label: "Pump Flow (L/h)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.aquaSystems).where(eq(schema.aquaSystems.farmId, farmId)).orderBy(asc(schema.aquaSystems.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.aquaSystems).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.aquaSystems).set(data).where(and(eq(schema.aquaSystems.id, id), eq(schema.aquaSystems.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.aquaSystems).where(and(eq(schema.aquaSystems.id, id), eq(schema.aquaSystems.farmId, farmId))); },
  },

  "cattle-dairy": {
    moduleId: "cattle-dairy",
    label: "Dairy Cows",
    primaryTable: "dairy_cows",
    columns: [
      { key: "animalId", label: "Animal ID" },
      { key: "breed", label: "Breed" },
      { key: "currentStatus", label: "Status" },
      { key: "calvingCount", label: "Calvings", type: "number" },
    ],
    formFields: [
      { key: "animalId", label: "Animal ID", type: "text", required: true },
      { key: "breed", label: "Breed", type: "select", optionsKey: "cattle-dairy-breed" },
      { key: "sex", label: "Sex", type: "select", options: [{ value: "FEMALE", label: "Female" }, { value: "MALE", label: "Male" }] },
      { key: "currentStatus", label: "Status", type: "select", options: [{ value: "LACTATING", label: "Lactating" }, { value: "DRY", label: "Dry" }, { value: "SOLD", label: "Sold" }, { value: "DECEASED", label: "Deceased" }] },
      { key: "sire", label: "Sire", type: "text" },
      { key: "dam", label: "Dam", type: "text" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.dairyCows).where(eq(schema.dairyCows.farmId, farmId)).orderBy(asc(schema.dairyCows.animalId)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.dairyCows).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.dairyCows).set(data).where(and(eq(schema.dairyCows.id, id), eq(schema.dairyCows.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.dairyCows).where(and(eq(schema.dairyCows.id, id), eq(schema.dairyCows.farmId, farmId))); },
  },

  "cattle-beef": {
    moduleId: "cattle-beef",
    label: "Beef Mobs",
    primaryTable: "beef_mobs",
    columns: [
      { key: "name", label: "Mob" },
      { key: "breed", label: "Breed" },
      { key: "headCount", label: "Head", type: "number" },
      { key: "location", label: "Location" },
    ],
    formFields: [
      { key: "name", label: "Mob Name", type: "text", required: true },
      { key: "breed", label: "Breed", type: "select", optionsKey: "cattle-beef-breed" },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "location", label: "Location", type: "text" },
      { key: "targetWeightKg", label: "Target Weight (kg)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.beefMobs).where(eq(schema.beefMobs.farmId, farmId)).orderBy(asc(schema.beefMobs.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.beefMobs).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.beefMobs).set(data).where(and(eq(schema.beefMobs.id, id), eq(schema.beefMobs.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.beefMobs).where(and(eq(schema.beefMobs.id, id), eq(schema.beefMobs.farmId, farmId))); },
  },

  sheep: {
    moduleId: "sheep",
    label: "Sheep Flocks",
    primaryTable: "sheep_flocks",
    columns: [
      { key: "name", label: "Flock" },
      { key: "breed", label: "Breed" },
      { key: "headCount", label: "Head", type: "number" },
    ],
    formFields: [
      { key: "name", label: "Flock Name", type: "text", required: true },
      { key: "breed", label: "Breed", type: "select", optionsKey: "sheep-breed" },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.sheepFlocks).where(eq(schema.sheepFlocks.farmId, farmId)).orderBy(asc(schema.sheepFlocks.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.sheepFlocks).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.sheepFlocks).set(data).where(and(eq(schema.sheepFlocks.id, id), eq(schema.sheepFlocks.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.sheepFlocks).where(and(eq(schema.sheepFlocks.id, id), eq(schema.sheepFlocks.farmId, farmId))); },
  },

  goats: {
    moduleId: "goats",
    label: "Goat Herds",
    primaryTable: "goat_herds",
    columns: [
      { key: "name", label: "Herd" },
      { key: "breed", label: "Breed" },
      { key: "headCount", label: "Head", type: "number" },
      { key: "type", label: "Type" },
    ],
    formFields: [
      { key: "name", label: "Herd Name", type: "text", required: true },
      { key: "breed", label: "Breed", type: "select", optionsKey: "goat-breed" },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "type", label: "Type", type: "select", options: [{ value: "DAIRY", label: "Dairy" }, { value: "MEAT", label: "Meat" }, { value: "FIBRE", label: "Fibre" }] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.goatHerds).where(eq(schema.goatHerds.farmId, farmId)).orderBy(asc(schema.goatHerds.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.goatHerds).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.goatHerds).set(data).where(and(eq(schema.goatHerds.id, id), eq(schema.goatHerds.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.goatHerds).where(and(eq(schema.goatHerds.id, id), eq(schema.goatHerds.farmId, farmId))); },
  },

  deer: {
    moduleId: "deer",
    label: "Deer Herds",
    primaryTable: "deer_herds",
    columns: [
      { key: "name", label: "Herd" },
      { key: "species", label: "Species" },
      { key: "headCount", label: "Head", type: "number" },
    ],
    formFields: [
      { key: "name", label: "Herd Name", type: "text", required: true },
      { key: "species", label: "Species", type: "select", optionsKey: "deer-species" },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.deerHerds).where(eq(schema.deerHerds.farmId, farmId)).orderBy(asc(schema.deerHerds.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.deerHerds).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.deerHerds).set(data).where(and(eq(schema.deerHerds.id, id), eq(schema.deerHerds.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.deerHerds).where(and(eq(schema.deerHerds.id, id), eq(schema.deerHerds.farmId, farmId))); },
  },

  pigs: {
    moduleId: "pigs",
    label: "Sows",
    primaryTable: "pig_sows",
    columns: [
      { key: "animalId", label: "Animal ID" },
      { key: "breed", label: "Breed" },
      { key: "parityCount", label: "Parity", type: "number" },
      { key: "status", label: "Status" },
    ],
    formFields: [
      { key: "animalId", label: "Animal ID", type: "text", required: true },
      { key: "breed", label: "Breed", type: "select", optionsKey: "pig-breed" },
      { key: "status", label: "Status", type: "select", options: [{ value: "ACTIVE", label: "Active" }, { value: "SOLD", label: "Sold" }, { value: "DECEASED", label: "Deceased" }] },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.pigSows).where(eq(schema.pigSows.farmId, farmId)).orderBy(asc(schema.pigSows.animalId)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.pigSows).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.pigSows).set(data).where(and(eq(schema.pigSows.id, id), eq(schema.pigSows.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.pigSows).where(and(eq(schema.pigSows.id, id), eq(schema.pigSows.farmId, farmId))); },
  },

  poultry: {
    moduleId: "poultry",
    label: "Poultry Flocks",
    primaryTable: "poultry_flocks",
    columns: [
      { key: "batchName", label: "Batch" },
      { key: "species", label: "Species" },
      { key: "birdCount", label: "Birds", type: "number" },
      { key: "purpose", label: "Purpose" },
    ],
    formFields: [
      { key: "batchName", label: "Batch Name", type: "text", required: true },
      { key: "species", label: "Species", type: "select", optionsKey: "poultry-species", required: true },
      { key: "breed", label: "Breed", type: "select", optionsKey: "poultry-breed" },
      { key: "birdCount", label: "Bird Count", type: "number", required: true },
      { key: "housedDate", label: "Housed Date", type: "date", required: true },
      { key: "purpose", label: "Purpose", type: "text", required: true },
      { key: "house", label: "House", type: "text" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.poultryFlocks).where(eq(schema.poultryFlocks.farmId, farmId)).orderBy(asc(schema.poultryFlocks.batchName)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.poultryFlocks).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.poultryFlocks).set(data).where(and(eq(schema.poultryFlocks.id, id), eq(schema.poultryFlocks.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.poultryFlocks).where(and(eq(schema.poultryFlocks.id, id), eq(schema.poultryFlocks.farmId, farmId))); },
  },

  bees: {
    moduleId: "bees",
    label: "Bee Hives",
    primaryTable: "bee_hives",
    columns: [
      { key: "hiveName", label: "Hive" },
      { key: "hiveType", label: "Type" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
    formFields: [
      { key: "hiveName", label: "Hive Name", type: "text", required: true },
      { key: "hiveType", label: "Type", type: "select", optionsKey: "bee-hive-type" },
      { key: "location", label: "Location", type: "text" },
      { key: "queenAge", label: "Queen Age", type: "number" },
      { key: "queenColor", label: "Queen Color", type: "text" },
      { key: "origin", label: "Origin", type: "text" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.beeHives).where(eq(schema.beeHives.farmId, farmId)).orderBy(asc(schema.beeHives.hiveName)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.beeHives).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.beeHives).set(data).where(and(eq(schema.beeHives.id, id), eq(schema.beeHives.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.beeHives).where(and(eq(schema.beeHives.id, id), eq(schema.beeHives.farmId, farmId))); },
  },

  pasture: {
    moduleId: "pasture",
    label: "Paddocks",
    primaryTable: "paddocks",
    columns: [
      { key: "name", label: "Paddock" },
      { key: "areaHa", label: "Area (ha)", type: "number" },
      { key: "soilType", label: "Soil Type" },
      { key: "grassType", label: "Grass Type" },
    ],
    formFields: [
      { key: "name", label: "Paddock Name", type: "text", required: true },
      { key: "areaHa", label: "Area (ha)", type: "number", required: true },
      { key: "soilType", label: "Soil Type", type: "select", optionsKey: "soil-type" },
      { key: "grassType", label: "Grass Type", type: "select", optionsKey: "pasture-species" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.paddocks).where(eq(schema.paddocks.farmId, farmId)).orderBy(asc(schema.paddocks.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.paddocks).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.paddocks).set(data).where(and(eq(schema.paddocks.id, id), eq(schema.paddocks.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.paddocks).where(and(eq(schema.paddocks.id, id), eq(schema.paddocks.farmId, farmId))); },
  },

  // ─── Platform: Financials ───────────────────────────────────────────────────

  financials: {
    moduleId: "financials",
    label: "Ledger Entries",
    primaryTable: "ledger_entries",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "type", label: "Type" },
      { key: "category", label: "Category" },
      { key: "moduleId", label: "Enterprise", format: (v) => ENTERPRISE_LABELS[String(v)] ?? (v ? String(v) : "—") },
      { key: "amount", label: "Amount", type: "number" },
      { key: "description", label: "Description" },
    ],
    formFields: [
      { key: "type", label: "Type", type: "select", required: true, options: [{ value: "INCOME", label: "Income" }, { value: "EXPENSE", label: "Expense" }] },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "category", label: "Category", type: "select", optionsKey: "ledger-category" },
      { key: "moduleId", label: "Enterprise", type: "select", options: ENTERPRISE_OPTIONS },
      { key: "description", label: "Description", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.ledgerEntries).where(eq(schema.ledgerEntries.farmId, farmId)).orderBy(desc(schema.ledgerEntries.date)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.ledgerEntries).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.ledgerEntries).set(data).where(and(eq(schema.ledgerEntries.id, id), eq(schema.ledgerEntries.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.ledgerEntries).where(and(eq(schema.ledgerEntries.id, id), eq(schema.ledgerEntries.farmId, farmId))); },
  },

  "input-prices": {
    moduleId: "input-prices",
    label: "Input Prices",
    primaryTable: "input_prices",
    columns: [
      { key: "itemName", label: "Item" },
      { key: "category", label: "Category" },
      { key: "unit", label: "Unit" },
      { key: "costPerUnit", label: "Cost / Unit", type: "number" },
      { key: "effectiveDate", label: "Effective From", type: "date" },
    ],
    formFields: [
      { key: "itemName", label: "Item", type: "text", required: true },
      { key: "category", label: "Category", type: "select", optionsKey: "input-price-category" },
      { key: "unit", label: "Unit", type: "select", optionsKey: "unit-of-measure" },
      { key: "costPerUnit", label: "Cost per Unit", type: "number", required: true },
      { key: "effectiveDate", label: "Effective From", type: "date", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.inputPrices).where(eq(schema.inputPrices.farmId, farmId)).orderBy(asc(schema.inputPrices.itemName)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.inputPrices).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.inputPrices).set(data).where(and(eq(schema.inputPrices.id, id), eq(schema.inputPrices.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.inputPrices).where(and(eq(schema.inputPrices.id, id), eq(schema.inputPrices.farmId, farmId))); },
  },

  "output-prices": {
    moduleId: "output-prices",
    label: "Output Prices",
    primaryTable: "output_prices",
    columns: [
      { key: "itemName", label: "Item" },
      { key: "category", label: "Category" },
      { key: "unit", label: "Unit" },
      { key: "pricePerUnit", label: "Price / Unit", type: "number" },
      { key: "effectiveDate", label: "Effective From", type: "date" },
    ],
    formFields: [
      { key: "itemName", label: "Item", type: "text", required: true },
      { key: "category", label: "Category", type: "select", optionsKey: "output-price-category" },
      { key: "unit", label: "Unit", type: "select", optionsKey: "unit-of-measure" },
      { key: "pricePerUnit", label: "Price per Unit", type: "number", required: true },
      { key: "effectiveDate", label: "Effective From", type: "date", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.outputPrices).where(eq(schema.outputPrices.farmId, farmId)).orderBy(asc(schema.outputPrices.itemName)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.outputPrices).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.outputPrices).set(data).where(and(eq(schema.outputPrices.id, id), eq(schema.outputPrices.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.outputPrices).where(and(eq(schema.outputPrices.id, id), eq(schema.outputPrices.farmId, farmId))); },
  },

  // ─── Platform: Soil & Water ─────────────────────────────────────────────────

  "soil-water": {
    moduleId: "soil-water",
    label: "Soil Tests",
    primaryTable: "soil_tests",
    columns: [
      { key: "testDate", label: "Test Date", type: "date" },
      { key: "fieldName", label: "Field" },
      { key: "pH", label: "pH", type: "number" },
      { key: "organicMatterPct", label: "OM (%)", type: "number" },
      { key: "nitrogenKgHa", label: "N (kg/ha)", type: "number" },
      { key: "phosphorusKgHa", label: "P (kg/ha)", type: "number" },
      { key: "potassiumKgHa", label: "K (kg/ha)", type: "number" },
    ],
    formFields: [
      { key: "testDate", label: "Test Date", type: "date", required: true },
      { key: "fieldName", label: "Field / Paddock", type: "text" },
      { key: "labReference", label: "Lab Reference", type: "text" },
      { key: "pH", label: "pH", type: "number" },
      { key: "organicMatterPct", label: "Organic Matter (%)", type: "number" },
      { key: "nitrogenKgHa", label: "Nitrogen (kg/ha)", type: "number" },
      { key: "phosphorusKgHa", label: "Phosphorus (kg/ha)", type: "number" },
      { key: "potassiumKgHa", label: "Potassium (kg/ha)", type: "number" },
      { key: "calciumKgHa", label: "Calcium (kg/ha)", type: "number" },
      { key: "sulphurKgHa", label: "Sulphur (kg/ha)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.soilTests).where(eq(schema.soilTests.farmId, farmId)).orderBy(desc(schema.soilTests.testDate)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.soilTests).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.soilTests).set(data).where(and(eq(schema.soilTests.id, id), eq(schema.soilTests.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.soilTests).where(and(eq(schema.soilTests.id, id), eq(schema.soilTests.farmId, farmId))); },
  },

  // ─── Platform: Inventory ────────────────────────────────────────────────────

  inventory: {
    moduleId: "inventory",
    label: "Inventory Items",
    primaryTable: "inventory_items",
    columns: [
      { key: "itemName", label: "Item" },
      { key: "category", label: "Category" },
      { key: "currentStock", label: "Stock", type: "number" },
      { key: "unit", label: "Unit" },
      { key: "reorderLevel", label: "Reorder Level", type: "number" },
      { key: "location", label: "Location" },
    ],
    formFields: [
      { key: "itemName", label: "Item Name", type: "text", required: true },
      { key: "category", label: "Category", type: "select", optionsKey: "inventory-category" },
      { key: "unit", label: "Unit", type: "select", optionsKey: "unit-of-measure" },
      { key: "currentStock", label: "Current Stock", type: "number", required: true },
      { key: "reorderLevel", label: "Reorder Level", type: "number" },
      { key: "location", label: "Storage Location", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.inventoryItems).where(eq(schema.inventoryItems.farmId, farmId)).orderBy(asc(schema.inventoryItems.itemName)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.inventoryItems).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.inventoryItems).set(data).where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.inventoryItems).where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.farmId, farmId))); },
  },

  // ─── Platform: Equipment ────────────────────────────────────────────────────

  equipment: {
    moduleId: "equipment",
    label: "Equipment",
    primaryTable: "equipment_assets",
    columns: [
      { key: "name", label: "Asset" },
      { key: "assetType", label: "Type" },
      { key: "make", label: "Make" },
      { key: "model", label: "Model" },
      { key: "nextServiceDate", label: "Next Service", type: "date" },
      { key: "wofExpiry", label: "WoF Expiry", type: "date" },
    ],
    formFields: [
      { key: "name", label: "Asset Name", type: "text", required: true },
      { key: "assetType", label: "Type", type: "select", optionsKey: "equipment-type" },
      { key: "make", label: "Make", type: "text" },
      { key: "model", label: "Model", type: "text" },
      { key: "serialNumber", label: "Serial Number", type: "text" },
      { key: "purchaseDate", label: "Purchase Date", type: "date" },
      { key: "purchasePrice", label: "Purchase Price", type: "number" },
      { key: "lastServiceDate", label: "Last Service Date", type: "date" },
      { key: "nextServiceDate", label: "Next Service Date", type: "date" },
      { key: "wofExpiry", label: "WoF Expiry", type: "date" },
      { key: "cofExpiry", label: "CoF Expiry", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.equipmentAssets).where(eq(schema.equipmentAssets.farmId, farmId)).orderBy(asc(schema.equipmentAssets.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.equipmentAssets).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.equipmentAssets).set(data).where(and(eq(schema.equipmentAssets.id, id), eq(schema.equipmentAssets.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.equipmentAssets).where(and(eq(schema.equipmentAssets.id, id), eq(schema.equipmentAssets.farmId, farmId))); },
  },

  // ─── Platform: Compliance ───────────────────────────────────────────────────

  compliance: {
    moduleId: "compliance",
    label: "Compliance Checks",
    primaryTable: "compliance_checks",
    columns: [
      { key: "checkName", label: "Check" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
      { key: "dueDate", label: "Due Date", type: "date" },
      { key: "completedDate", label: "Completed", type: "date" },
    ],
    formFields: [
      { key: "checkName", label: "Check Name", type: "text", required: true },
      { key: "category", label: "Category", type: "select", optionsKey: "compliance-category" },
      { key: "countryProfile", label: "Country Profile", type: "text" },
      { key: "status", label: "Status", type: "select", required: true, options: [
        { value: "PENDING", label: "Pending" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "DONE", label: "Done" },
        { value: "OVERDUE", label: "Overdue" },
      ]},
      { key: "dueDate", label: "Due Date", type: "date" },
      { key: "completedDate", label: "Completed Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.complianceChecks).where(eq(schema.complianceChecks.farmId, farmId)).orderBy(asc(schema.complianceChecks.dueDate)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.complianceChecks).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.complianceChecks).set(data).where(and(eq(schema.complianceChecks.id, id), eq(schema.complianceChecks.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.complianceChecks).where(and(eq(schema.complianceChecks.id, id), eq(schema.complianceChecks.farmId, farmId))); },
  },

  // ─── Platform: Staff ────────────────────────────────────────────────────────

  staff: {
    moduleId: "staff",
    label: "Staff",
    primaryTable: "staff_members",
    columns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "contractType", label: "Contract" },
      { key: "phone", label: "Phone" },
      { key: "startDate", label: "Start Date", type: "date" },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "role", label: "Role", type: "select", optionsKey: "staff-role" },
      { key: "contractType", label: "Contract Type", type: "select", options: [
        { value: "EMPLOYEE", label: "Employee" },
        { value: "CONTRACTOR", label: "Contractor" },
        { value: "SEASONAL", label: "Seasonal" },
      ]},
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.staffMembers).where(eq(schema.staffMembers.farmId, farmId)).orderBy(asc(schema.staffMembers.name)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.staffMembers).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.staffMembers).set(data).where(and(eq(schema.staffMembers.id, id), eq(schema.staffMembers.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.staffMembers).where(and(eq(schema.staffMembers.id, id), eq(schema.staffMembers.farmId, farmId))); },
  },

  // ─── Platform: Livestock Traceability ───────────────────────────────────────

  "livestock-traceability": {
    moduleId: "livestock-traceability",
    label: "Movements",
    primaryTable: "livestock_movements",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "species", label: "Species", format: (v) => TRACEABLE_SPECIES_LABELS[String(v)] ?? (v ? String(v) : "—") },
      { key: "direction", label: "Direction" },
      { key: "headCount", label: "Head", type: "number" },
      { key: "tagNumbers", label: "Tag Numbers" },
      { key: "scheme", label: "Scheme", format: (v) => TRACEABILITY_SCHEMES[String(v)]?.name ?? (v ? String(v) : "—") },
      { key: "counterpartyName", label: "Counterparty" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "species", label: "Species", type: "select", required: true, options: TRACEABLE_SPECIES_OPTIONS },
      { key: "direction", label: "Direction", type: "select", required: true, options: [
        { value: "IN", label: "Onto Property (IN)" },
        { value: "OUT", label: "Off Property (OUT)" },
      ]},
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "tagNumbers", label: "Tag Numbers", type: "textarea" },
      { key: "counterpartyName", label: "Counterparty Name", type: "text" },
      { key: "counterpartyPropertyId", label: "Counterparty Property ID", type: "text" },
      { key: "reference", label: "Movement Reference #", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.livestockMovements).where(eq(schema.livestockMovements.farmId, farmId)).orderBy(desc(schema.livestockMovements.date)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const db = await getDb();
      let scheme = (data as Record<string, unknown>).scheme as string | undefined;
      if (!scheme) {
        const [farm] = await db.select({ countryProfile: schema.farms.countryProfile }).from(schema.farms).where(eq(schema.farms.id, farmId)).limit(1);
        scheme = resolveCountryProfile(farm?.countryProfile).regulatory.traceabilityScheme;
      }
      const [row] = await db.insert(schema.livestockMovements).values({ ...data, farmId, scheme } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.livestockMovements).set(data).where(and(eq(schema.livestockMovements.id, id), eq(schema.livestockMovements.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.livestockMovements).where(and(eq(schema.livestockMovements.id, id), eq(schema.livestockMovements.farmId, farmId))); },
  },
};

// ─── Sub-table adapters (Phase 18) ──────────────────────────────────────────
// Transactional/event tables that already existed in the schema but had no UI.
// Reached via the tab bar in ModulePage (see MODULE_TAB_GROUPS below), not via
// their own nav entries.

const CHILD_MODULE_ADAPTERS: Record<string, ModuleAdapter> = {
  "cattle-dairy-milk": makeChildAdapter({
    moduleId: "cattle-dairy-milk",
    label: "Milk Records",
    table: schema.dairyMilkRecords,
    parentTable: schema.dairyCows,
    parentIdField: "cowId",
    parentLabel: "Cow",
    parentLabelField: "animalId",
    parentOptionsModuleId: "cattle-dairy",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "liters", label: "Litres", type: "number" },
      { key: "fatPct", label: "Fat %", type: "number" },
      { key: "scc", label: "SCC", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "liters", label: "Litres", type: "number", required: true },
      { key: "fatPct", label: "Fat %", type: "number" },
      { key: "proteinPct", label: "Protein %", type: "number" },
      { key: "scc", label: "Somatic Cell Count", type: "number" },
      { key: "comments", label: "Comments", type: "textarea" },
    ],
  }),

  "cattle-dairy-health": makeChildAdapter({
    moduleId: "cattle-dairy-health",
    label: "Health Events",
    table: schema.dairyHealthEvents,
    parentTable: schema.dairyCows,
    parentIdField: "cowId",
    parentLabel: "Cow",
    parentLabelField: "animalId",
    parentOptionsModuleId: "cattle-dairy",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "eventType", label: "Event" },
      { key: "description", label: "Description" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "eventType", label: "Event Type", type: "select", optionsKey: "treatment-type", required: true },
      { key: "description", label: "Description", type: "text", required: true },
      { key: "withdrawnUntil", label: "Withheld Until", type: "date" },
    ],
  }),

  "cattle-beef-weight": makeChildAdapter({
    moduleId: "cattle-beef-weight",
    label: "Weight Records",
    table: schema.beefWeightRecords,
    parentTable: schema.beefMobs,
    parentIdField: "mobId",
    parentLabel: "Mob",
    parentLabelField: "name",
    parentOptionsModuleId: "cattle-beef",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "avgWeightKg", label: "Avg Weight (kg)", type: "number" },
      { key: "sampleCount", label: "Sample Size", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "avgWeightKg", label: "Average Weight (kg)", type: "number", required: true },
      { key: "sampleCount", label: "Sample Size", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "cattle-beef-drafting": makeChildAdapter({
    moduleId: "cattle-beef-drafting",
    label: "Draftings",
    table: schema.beefDraftings,
    parentTable: schema.beefMobs,
    parentIdField: "mobId",
    parentLabel: "Mob",
    parentLabelField: "name",
    parentOptionsModuleId: "cattle-beef",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "headCount", label: "Head", type: "number" },
      { key: "avgWeightKg", label: "Avg Weight (kg)", type: "number" },
      { key: "destination", label: "Destination" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "avgWeightKg", label: "Average Weight (kg)", type: "number", required: true },
      { key: "destination", label: "Destination", type: "text", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "sheep-lambing": makeChildAdapter({
    moduleId: "sheep-lambing",
    label: "Lambing Records",
    table: schema.sheepLambingRecords,
    parentTable: schema.sheepFlocks,
    parentIdField: "flockId",
    parentLabel: "Flock",
    parentLabelField: "name",
    parentOptionsModuleId: "sheep",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "season", label: "Season" },
      { key: "ewesLambed", label: "Ewes Lambed", type: "number" },
      { key: "lambsBorn", label: "Lambs Born", type: "number" },
      { key: "lambingPct", label: "Lambing %", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "season", label: "Season", type: "text", required: true },
      { key: "ewesLambed", label: "Ewes Lambed", type: "number", required: true },
      { key: "lambsBorn", label: "Lambs Born", type: "number", required: true },
      { key: "lambsAlive", label: "Lambs Alive", type: "number", required: true },
      { key: "lambingPct", label: "Lambing %", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "sheep-drenching": makeChildAdapter({
    moduleId: "sheep-drenching",
    label: "Drenching Records",
    table: schema.sheepDrenchingRecords,
    parentTable: schema.sheepFlocks,
    parentIdField: "flockId",
    parentLabel: "Flock",
    parentLabelField: "name",
    parentOptionsModuleId: "sheep",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "product", label: "Product" },
      { key: "headCount", label: "Head", type: "number" },
      { key: "withholdingMeat", label: "Meat WHP (days)", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "product", label: "Product", type: "text", required: true },
      { key: "doseMl", label: "Dose (mL)", type: "number" },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "withholdingMeat", label: "Meat Withholding (days)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "sheep-shearing": makeChildAdapter({
    moduleId: "sheep-shearing",
    label: "Shearing Records",
    table: schema.sheepShearingRecords,
    parentTable: schema.sheepFlocks,
    parentIdField: "flockId",
    parentLabel: "Flock",
    parentLabelField: "name",
    parentOptionsModuleId: "sheep",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "headCount", label: "Head", type: "number" },
      { key: "woolKg", label: "Wool (kg)", type: "number" },
      { key: "woolGrade", label: "Grade" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "woolKg", label: "Wool (kg)", type: "number", required: true },
      { key: "woolGrade", label: "Wool Grade", type: "text" },
      { key: "buyer", label: "Buyer", type: "text" },
      { key: "pricePerKg", label: "Price / kg", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "goats-milk": makeChildAdapter({
    moduleId: "goats-milk",
    label: "Milk Records",
    table: schema.goatMilkRecords,
    parentTable: schema.goatHerds,
    parentIdField: "herdId",
    parentLabel: "Herd",
    parentLabelField: "name",
    parentOptionsModuleId: "goats",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "liters", label: "Litres", type: "number" },
      { key: "butterfat", label: "Butterfat %", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "liters", label: "Litres", type: "number", required: true },
      { key: "butterfat", label: "Butterfat %", type: "number" },
      { key: "protein", label: "Protein %", type: "number" },
      { key: "comments", label: "Comments", type: "textarea" },
    ],
  }),

  "goats-fibre": makeChildAdapter({
    moduleId: "goats-fibre",
    label: "Fibre Records",
    table: schema.goatFibreRecords,
    parentTable: schema.goatHerds,
    parentIdField: "herdId",
    parentLabel: "Herd",
    parentLabelField: "name",
    parentOptionsModuleId: "goats",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "fibreKg", label: "Fibre (kg)", type: "number" },
      { key: "fibreType", label: "Type" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "fibreKg", label: "Fibre (kg)", type: "number", required: true },
      { key: "fibreType", label: "Fibre Type", type: "text" },
      { key: "grade", label: "Grade", type: "text" },
      { key: "buyer", label: "Buyer", type: "text" },
      { key: "pricePerKg", label: "Price / kg", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "deer-velvet": makeChildAdapter({
    moduleId: "deer-velvet",
    label: "Velvet Records",
    table: schema.deerVelvetRecords,
    parentTable: schema.deerHerds,
    parentIdField: "herdId",
    parentLabel: "Herd",
    parentLabelField: "name",
    parentOptionsModuleId: "deer",
    dateField: "harvestDate",
    columns: [
      { key: "harvestDate", label: "Harvest Date", type: "date" },
      { key: "stagId", label: "Stag ID" },
      { key: "velvetKg", label: "Velvet (kg)", type: "number" },
      { key: "grade", label: "Grade" },
    ],
    formFields: [
      { key: "stagId", label: "Stag ID", type: "text" },
      { key: "harvestDate", label: "Harvest Date", type: "date", required: true },
      { key: "velvetKg", label: "Velvet (kg)", type: "number", required: true },
      { key: "grade", label: "Grade", type: "text" },
      { key: "buyer", label: "Buyer", type: "text" },
      { key: "pricePerKg", label: "Price / kg", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "deer-venison": makeChildAdapter({
    moduleId: "deer-venison",
    label: "Venison Records",
    table: schema.deerVenisonRecords,
    parentTable: schema.deerHerds,
    parentIdField: "herdId",
    parentLabel: "Herd",
    parentLabelField: "name",
    parentOptionsModuleId: "deer",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "headCount", label: "Head", type: "number" },
      { key: "carcassKg", label: "Carcass (kg)", type: "number" },
      { key: "grade", label: "Grade" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "carcassKg", label: "Carcass Weight (kg)", type: "number", required: true },
      { key: "grade", label: "Grade", type: "text" },
      { key: "buyer", label: "Buyer", type: "text" },
      { key: "pricePerKg", label: "Price / kg", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "pigs-litters": makeChildAdapter({
    moduleId: "pigs-litters",
    label: "Litters",
    table: schema.pigLitters,
    parentTable: schema.pigSows,
    parentIdField: "sowId",
    parentLabel: "Sow",
    parentLabelField: "animalId",
    parentOptionsModuleId: "pigs",
    dateField: "farrowDate",
    columns: [
      { key: "farrowDate", label: "Farrow Date", type: "date" },
      { key: "pigletsBorn", label: "Born", type: "number" },
      { key: "pigletsAlive", label: "Alive", type: "number" },
      { key: "pigletsWeaned", label: "Weaned", type: "number" },
    ],
    formFields: [
      { key: "farrowDate", label: "Farrow Date", type: "date", required: true },
      { key: "pigletsBorn", label: "Piglets Born", type: "number", required: true },
      { key: "pigletsAlive", label: "Piglets Alive", type: "number", required: true },
      { key: "pigletsWeaned", label: "Piglets Weaned", type: "number" },
      { key: "weanDate", label: "Wean Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "poultry-eggs": makeChildAdapter({
    moduleId: "poultry-eggs",
    label: "Egg Records",
    table: schema.poultryEggRecords,
    parentTable: schema.poultryFlocks,
    parentIdField: "flockId",
    parentLabel: "Flock",
    parentLabelField: "batchName",
    parentOptionsModuleId: "poultry",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "eggCount", label: "Eggs", type: "number" },
      { key: "grade", label: "Grade" },
      { key: "cracked", label: "Cracked", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "eggCount", label: "Egg Count", type: "number", required: true },
      { key: "grade", label: "Grade", type: "text" },
      { key: "cracked", label: "Cracked", type: "number" },
      { key: "comments", label: "Comments", type: "textarea" },
    ],
  }),

  "poultry-mortality": makeChildAdapter({
    moduleId: "poultry-mortality",
    label: "Mortality Records",
    table: schema.poultryMortality,
    parentTable: schema.poultryFlocks,
    parentIdField: "flockId",
    parentLabel: "Flock",
    parentLabelField: "batchName",
    parentOptionsModuleId: "poultry",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "count", label: "Count", type: "number" },
      { key: "cause", label: "Cause" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "count", label: "Count", type: "number", required: true },
      { key: "cause", label: "Cause", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "bees-inspections": makeChildAdapter({
    moduleId: "bees-inspections",
    label: "Hive Inspections",
    table: schema.beeInspections,
    parentTable: schema.beeHives,
    parentIdField: "hiveId",
    parentLabel: "Hive",
    parentLabelField: "hiveName",
    parentOptionsModuleId: "bees",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "temperament", label: "Temperament" },
      { key: "broodPattern", label: "Brood Pattern" },
      { key: "miteCount", label: "Mite Count", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "temperament", label: "Temperament", type: "text" },
      { key: "queenSeen", label: "Queen Seen", type: "select", boolean: true, options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
      { key: "eggsPresent", label: "Eggs Present", type: "select", boolean: true, options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
      { key: "broodPattern", label: "Brood Pattern", type: "text" },
      { key: "miteCount", label: "Mite Count", type: "number" },
      { key: "foodStores", label: "Food Stores", type: "text" },
      { key: "diseaseSigns", label: "Disease Signs", type: "text" },
      { key: "action", label: "Action Taken", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "bees-honey": makeChildAdapter({
    moduleId: "bees-honey",
    label: "Honey Harvests",
    table: schema.beeHoneyHarvests,
    parentTable: schema.beeHives,
    parentIdField: "hiveId",
    parentLabel: "Hive",
    parentLabelField: "hiveName",
    parentOptionsModuleId: "bees",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "kg", label: "Honey (kg)", type: "number" },
      { key: "type", label: "Type" },
      { key: "grade", label: "Grade" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "kg", label: "Honey (kg)", type: "number", required: true },
      { key: "type", label: "Type", type: "text" },
      { key: "grade", label: "Grade", type: "text" },
      { key: "buyer", label: "Buyer", type: "text" },
      { key: "pricePerKg", label: "Price / kg", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "pasture-rotations": makeChildAdapter({
    moduleId: "pasture-rotations",
    label: "Paddock Rotations",
    table: schema.paddockRotations,
    parentTable: schema.paddocks,
    parentIdField: "paddockId",
    parentLabel: "Paddock",
    parentLabelField: "name",
    parentOptionsModuleId: "pasture",
    dateField: "startDate",
    columns: [
      { key: "startDate", label: "Start", type: "date" },
      { key: "endDate", label: "End", type: "date" },
      { key: "stockType", label: "Stock" },
      { key: "headCount", label: "Head", type: "number" },
    ],
    formFields: [
      { key: "startDate", label: "Start Date", type: "date", required: true },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "stockType", label: "Stock Type", type: "text" },
      { key: "headCount", label: "Head Count", type: "number" },
      { key: "comments", label: "Comments", type: "textarea" },
    ],
  }),

  "pasture-cover": makeChildAdapter({
    moduleId: "pasture-cover",
    label: "Pasture Cover Records",
    table: schema.pastureCoverRecords,
    parentTable: schema.paddocks,
    parentIdField: "paddockId",
    parentLabel: "Paddock",
    parentLabelField: "name",
    parentOptionsModuleId: "pasture",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "coverKgHa", label: "Cover (kgDM/ha)", type: "number" },
      { key: "method", label: "Method" },
      { key: "growthRate", label: "Growth Rate", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "coverKgHa", label: "Cover (kgDM/ha)", type: "number", required: true },
      { key: "method", label: "Measurement Method", type: "text" },
      { key: "growthRate", label: "Growth Rate", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "field-management-plots": makeChildAdapter({
    moduleId: "field-management-plots",
    label: "Plots",
    table: schema.plots,
    parentTable: schema.fields,
    parentIdField: "fieldId",
    parentLabel: "Field",
    parentLabelField: "name",
    parentOptionsModuleId: "field-management",
    columns: [
      { key: "name", label: "Plot" },
      { key: "row", label: "Row", type: "number" },
      { key: "col", label: "Col", type: "number" },
      { key: "areaSqm", label: "Area (m²)", type: "number" },
    ],
    formFields: [
      { key: "name", label: "Plot Name", type: "text", required: true },
      { key: "row", label: "Row", type: "number" },
      { key: "col", label: "Column", type: "number" },
      { key: "areaSqm", label: "Area (m²)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "crop-planning-tasks": makeChildAdapter({
    moduleId: "crop-planning-tasks",
    label: "Planting Tasks",
    table: schema.plantingTasks,
    parentTable: schema.cropPlans,
    parentIdField: "cropPlanId",
    parentLabel: "Crop Plan",
    parentLabelField: "cropVariety",
    parentOptionsModuleId: "crop-planning",
    dateField: "dueDate",
    columns: [
      { key: "taskType", label: "Task" },
      { key: "dueDate", label: "Due", type: "date" },
      { key: "completedDate", label: "Completed", type: "date" },
      { key: "assignedTo", label: "Assigned To" },
    ],
    formFields: [
      { key: "taskType", label: "Task Type", type: "text", required: true },
      { key: "dueDate", label: "Due Date", type: "date", required: true },
      { key: "completedDate", label: "Completed Date", type: "date" },
      { key: "assignedTo", label: "Assigned To", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "harvest-tracking-records": makeChildAdapter({
    moduleId: "harvest-tracking-records",
    label: "Harvest Records",
    table: schema.harvestRecords,
    parentTable: schema.harvestBatches,
    parentIdField: "batchId",
    parentLabel: "Batch",
    parentLabelField: "cropVariety",
    parentOptionsModuleId: "harvest-tracking",
    columns: [
      { key: "yieldKg", label: "Yield (kg)", type: "number" },
      { key: "grade", label: "Grade" },
    ],
    formFields: [
      { key: "yieldKg", label: "Yield (kg)", type: "number", required: true },
      { key: "grade", label: "Grade", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "viticulture-vintage": makeChildAdapter({
    moduleId: "viticulture-vintage",
    label: "Vintage Records",
    table: schema.vintageRecords,
    parentTable: schema.vitBlocks,
    parentIdField: "blockId",
    parentLabel: "Block",
    parentLabelField: "name",
    parentOptionsModuleId: "viticulture",
    dateField: "harvestDate",
    columns: [
      { key: "year", label: "Year", type: "number" },
      { key: "harvestDate", label: "Harvest Date", type: "date" },
      { key: "brixAtHarvest", label: "Brix", type: "number" },
      { key: "yieldKg", label: "Yield (kg)", type: "number" },
    ],
    formFields: [
      { key: "year", label: "Year", type: "number", required: true },
      { key: "harvestDate", label: "Harvest Date", type: "date" },
      { key: "brixAtHarvest", label: "Brix at Harvest", type: "number" },
      { key: "phAtHarvest", label: "pH at Harvest", type: "number" },
      { key: "taAtHarvest", label: "TA at Harvest", type: "number" },
      { key: "yieldKg", label: "Yield (kg)", type: "number" },
      { key: "winemaker", label: "Winemaker", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "viticulture-canopy": makeChildAdapter({
    moduleId: "viticulture-canopy",
    label: "Canopy Notes",
    table: schema.canopyNotes,
    parentTable: schema.vitBlocks,
    parentIdField: "blockId",
    parentLabel: "Block",
    parentLabelField: "name",
    parentOptionsModuleId: "viticulture",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "shootLengthCm", label: "Shoot Length (cm)", type: "number" },
      { key: "leafAreaIndex", label: "Leaf Area Index", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "shootLengthCm", label: "Shoot Length (cm)", type: "number" },
      { key: "lateralGrowth", label: "Lateral Growth", type: "text" },
      { key: "leafAreaIndex", label: "Leaf Area Index", type: "number" },
      { key: "observations", label: "Observations", type: "textarea" },
    ],
  }),

  "orchard-trees": makeChildAdapter({
    moduleId: "orchard-trees",
    label: "Tree Inventory",
    table: schema.treeInventory,
    parentTable: schema.orchardBlocks,
    parentIdField: "blockId",
    parentLabel: "Block",
    parentLabelField: "name",
    parentOptionsModuleId: "orchard",
    columns: [
      { key: "treeCount", label: "Trees", type: "number" },
      { key: "treeSpacingM", label: "Tree Spacing (m)", type: "number" },
      { key: "trainingSystem", label: "Training System" },
    ],
    formFields: [
      { key: "treeCount", label: "Tree Count", type: "number", required: true },
      { key: "treeSpacingM", label: "Tree Spacing (m)", type: "number" },
      { key: "rowSpacingM", label: "Row Spacing (m)", type: "number" },
      { key: "trainingSystem", label: "Training System", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "orchard-bins": makeChildAdapter({
    moduleId: "orchard-bins",
    label: "Harvest Bins",
    table: schema.orchardHarvestBins,
    parentTable: schema.orchardBlocks,
    parentIdField: "blockId",
    parentLabel: "Block",
    parentLabelField: "name",
    parentOptionsModuleId: "orchard",
    dateField: "harvestDate",
    columns: [
      { key: "harvestDate", label: "Harvest Date", type: "date" },
      { key: "binCount", label: "Bins", type: "number" },
      { key: "weightKg", label: "Weight (kg)", type: "number" },
      { key: "grade", label: "Grade" },
    ],
    formFields: [
      { key: "harvestDate", label: "Harvest Date", type: "date", required: true },
      { key: "binCount", label: "Bin Count", type: "number", required: true },
      { key: "weightKg", label: "Weight (kg)", type: "number" },
      { key: "grade", label: "Grade", type: "text" },
      { key: "coolstoreId", label: "Coolstore ID", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "vegetables-successions": makeChildAdapter({
    moduleId: "vegetables-successions",
    label: "Successions",
    table: schema.vegSuccessions,
    parentTable: schema.vegBeds,
    parentIdField: "bedId",
    parentLabel: "Bed",
    parentLabelField: "name",
    parentOptionsModuleId: "vegetables",
    dateField: "plantDate",
    columns: [
      { key: "cropVariety", label: "Crop / Variety" },
      { key: "plantDate", label: "Planted", type: "date" },
      { key: "expectedHarvestDate", label: "Expected Harvest", type: "date" },
      { key: "yieldKg", label: "Yield (kg)", type: "number" },
    ],
    formFields: [
      { key: "cropVariety", label: "Crop / Variety", type: "select", optionsKey: "crop-variety", required: true },
      { key: "plantDate", label: "Plant Date", type: "date", required: true },
      { key: "transplantDate", label: "Transplant Date", type: "date" },
      { key: "expectedHarvestDate", label: "Expected Harvest", type: "date" },
      { key: "actualHarvestDate", label: "Actual Harvest", type: "date" },
      { key: "yieldKg", label: "Yield (kg)", type: "number" },
      { key: "seedSource", label: "Seed Source", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "microgreens-trays": makeChildAdapter({
    moduleId: "microgreens-trays",
    label: "Trays",
    table: schema.microgreenTrays,
    parentTable: schema.microgreenBatches,
    parentIdField: "batchId",
    parentLabel: "Batch",
    parentLabelField: "variety",
    parentOptionsModuleId: "microgreens",
    columns: [
      { key: "trayNumber", label: "Tray #", type: "number" },
      { key: "yieldGrams", label: "Yield (g)", type: "number" },
    ],
    formFields: [
      { key: "trayNumber", label: "Tray Number", type: "number", required: true },
      { key: "yieldGrams", label: "Yield (g)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "protected-cropping-climate": makeChildAdapter({
    moduleId: "protected-cropping-climate",
    label: "Climate Logs",
    table: schema.climateLogs,
    parentTable: schema.structures,
    parentIdField: "structureId",
    parentLabel: "Structure",
    parentLabelField: "name",
    parentOptionsModuleId: "protected-cropping",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "tempMinC", label: "Min °C", type: "number" },
      { key: "tempMaxC", label: "Max °C", type: "number" },
      { key: "humidityPct", label: "Humidity %", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "tempMinC", label: "Min Temp (°C)", type: "number" },
      { key: "tempMaxC", label: "Max Temp (°C)", type: "number" },
      { key: "humidityPct", label: "Humidity %", type: "number" },
      { key: "co2Ppm", label: "CO2 (ppm)", type: "number" },
      { key: "lightLux", label: "Light (lux)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "protected-cropping-fertigation": makeChildAdapter({
    moduleId: "protected-cropping-fertigation",
    label: "Fertigation Events",
    table: schema.fertigationEvents,
    parentTable: schema.structures,
    parentIdField: "structureId",
    parentLabel: "Structure",
    parentLabelField: "name",
    parentOptionsModuleId: "protected-cropping",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "ec", label: "EC", type: "number" },
      { key: "ph", label: "pH", type: "number" },
      { key: "volumeLitres", label: "Volume (L)", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "ec", label: "EC", type: "number" },
      { key: "ph", label: "pH", type: "number" },
      { key: "volumeLitres", label: "Volume (L)", type: "number" },
      { key: "irrigationMins", label: "Irrigation (mins)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "aquaponics-fish": makeChildAdapter({
    moduleId: "aquaponics-fish",
    label: "Fish Stocks",
    table: schema.fishStocks,
    parentTable: schema.aquaSystems,
    parentIdField: "systemId",
    parentLabel: "System",
    parentLabelField: "name",
    parentOptionsModuleId: "aquaponics",
    dateField: "stockDate",
    columns: [
      { key: "species", label: "Species" },
      { key: "stockCount", label: "Count", type: "number" },
      { key: "averageWeightG", label: "Avg Weight (g)", type: "number" },
      { key: "stockDate", label: "Stocked", type: "date" },
    ],
    formFields: [
      { key: "species", label: "Species", type: "text", required: true },
      { key: "stockCount", label: "Stock Count", type: "number", required: true },
      { key: "averageWeightG", label: "Average Weight (g)", type: "number" },
      { key: "stockDate", label: "Stock Date", type: "date", required: true },
      { key: "source", label: "Source", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "aquaponics-water": makeChildAdapter({
    moduleId: "aquaponics-water",
    label: "Water Quality Logs",
    table: schema.waterQualityLogs,
    parentTable: schema.aquaSystems,
    parentIdField: "systemId",
    parentLabel: "System",
    parentLabelField: "name",
    parentOptionsModuleId: "aquaponics",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "ph", label: "pH", type: "number" },
      { key: "ammoniaMgl", label: "Ammonia (mg/L)", type: "number" },
      { key: "doMgl", label: "DO (mg/L)", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "ph", label: "pH", type: "number" },
      { key: "ammoniaMgl", label: "Ammonia (mg/L)", type: "number" },
      { key: "nitriteMgl", label: "Nitrite (mg/L)", type: "number" },
      { key: "nitrateMgl", label: "Nitrate (mg/L)", type: "number" },
      { key: "doMgl", label: "Dissolved Oxygen (mg/L)", type: "number" },
      { key: "tempC", label: "Temp (°C)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "aquaponics-feeding": makeChildAdapter({
    moduleId: "aquaponics-feeding",
    label: "Feeding Events",
    table: schema.aquaFeedingEvents,
    parentTable: schema.aquaSystems,
    parentIdField: "systemId",
    parentLabel: "System",
    parentLabelField: "name",
    parentOptionsModuleId: "aquaponics",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "feedType", label: "Feed Type" },
      { key: "amountG", label: "Amount (g)", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "feedType", label: "Feed Type", type: "select", optionsKey: "feed-type" },
      { key: "amountG", label: "Amount (g)", type: "number", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  "aquaponics-yields": makeChildAdapter({
    moduleId: "aquaponics-yields",
    label: "Plant Yields",
    table: schema.aquaPlantYields,
    parentTable: schema.aquaSystems,
    parentIdField: "systemId",
    parentLabel: "System",
    parentLabelField: "name",
    parentOptionsModuleId: "aquaponics",
    dateField: "date",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "cropVariety", label: "Crop / Variety" },
      { key: "yieldGrams", label: "Yield (g)", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "cropVariety", label: "Crop / Variety", type: "select", optionsKey: "crop-variety", required: true },
      { key: "yieldGrams", label: "Yield (g)", type: "number", required: true },
      { key: "bed", label: "Bed", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  }),

  // Two child tables are farm-scoped directly (no parent record to pick), so they
  // follow the plain top-level adapter shape instead of `makeChildAdapter`.
  "pest-spray-log-events": {
    moduleId: "pest-spray-log-events",
    label: "Spray Events",
    primaryTable: "spray_events",
    columns: [
      { key: "applicationDate", label: "Date", type: "date" },
      { key: "ratePerHa", label: "Rate / ha", type: "number" },
      { key: "operator", label: "Operator" },
      { key: "withholdingEndDate", label: "WHP Ends", type: "date" },
    ],
    formFields: [
      { key: "applicationDate", label: "Application Date", type: "date", required: true },
      { key: "chemicalId", label: "Chemical", type: "select", foreignKey: { moduleId: "pest-spray-log", labelField: "name" } },
      { key: "fieldId", label: "Field", type: "select", foreignKey: { moduleId: "field-management", labelField: "name" } },
      { key: "ratePerHa", label: "Rate / ha", type: "number" },
      { key: "totalVolumeLitres", label: "Total Volume (L)", type: "number" },
      { key: "operator", label: "Operator", type: "text" },
      { key: "weatherConditions", label: "Weather Conditions", type: "text" },
      { key: "windSpeedKph", label: "Wind Speed (kph)", type: "number" },
      { key: "tempC", label: "Temp (°C)", type: "number" },
      { key: "withholdingEndDate", label: "Withholding End Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.sprayEvents).where(eq(schema.sprayEvents.farmId, farmId)).orderBy(desc(schema.sprayEvents.applicationDate)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.sprayEvents).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.sprayEvents).set(data).where(and(eq(schema.sprayEvents.id, id), eq(schema.sprayEvents.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.sprayEvents).where(and(eq(schema.sprayEvents.id, id), eq(schema.sprayEvents.farmId, farmId))); },
  },

  "pigs-feed": {
    moduleId: "pigs-feed",
    label: "Feed Records",
    primaryTable: "pig_feed_records",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "groupName", label: "Group" },
      { key: "headCount", label: "Head", type: "number" },
      { key: "feedType", label: "Feed Type" },
      { key: "feedKg", label: "Feed (kg)", type: "number" },
    ],
    formFields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "groupName", label: "Group Name", type: "text", required: true },
      { key: "headCount", label: "Head Count", type: "number", required: true },
      { key: "feedType", label: "Feed Type", type: "select", optionsKey: "feed-type", required: true },
      { key: "feedKg", label: "Feed (kg)", type: "number", required: true },
      { key: "costPerKg", label: "Cost / kg", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    list: async (farmId) => (await getDb()).select().from(schema.pigFeedRecords).where(eq(schema.pigFeedRecords.farmId, farmId)).orderBy(desc(schema.pigFeedRecords.date)) as unknown as Promise<Record<string, unknown>[]>,
    create: async (farmId, data) => {
      const [row] = await getDb().insert(schema.pigFeedRecords).values({ ...data, farmId } as any).returning();
      return row as Record<string, unknown>;
    },
    update: async (farmId, id, data) => {
      const [row] = await getDb().update(schema.pigFeedRecords).set(data).where(and(eq(schema.pigFeedRecords.id, id), eq(schema.pigFeedRecords.farmId, farmId))).returning();
      return row as Record<string, unknown>;
    },
    delete: async (farmId, id) => { await getDb().delete(schema.pigFeedRecords).where(and(eq(schema.pigFeedRecords.id, id), eq(schema.pigFeedRecords.farmId, farmId))); },
  },
};

Object.assign(MODULE_ADAPTERS, CHILD_MODULE_ADAPTERS);

/** Ordered tab groups shown in ModulePage for modules that have sub-tables — the
 * first entry is always the base/parent module reached via the main route. */
export const MODULE_TAB_GROUPS: Record<string, { id: string; label: string }[]> = {
  "field-management": [
    { id: "field-management", label: "Fields" },
    { id: "field-management-plots", label: "Plots" },
  ],
  "crop-planning": [
    { id: "crop-planning", label: "Crop Plans" },
    { id: "crop-planning-tasks", label: "Planting Tasks" },
  ],
  "harvest-tracking": [
    { id: "harvest-tracking", label: "Batches" },
    { id: "harvest-tracking-records", label: "Records" },
  ],
  "pest-spray-log": [
    { id: "pest-spray-log", label: "Chemicals" },
    { id: "pest-spray-log-events", label: "Spray Events" },
  ],
  viticulture: [
    { id: "viticulture", label: "Blocks" },
    { id: "viticulture-vintage", label: "Vintage Records" },
    { id: "viticulture-canopy", label: "Canopy Notes" },
  ],
  orchard: [
    { id: "orchard", label: "Blocks" },
    { id: "orchard-trees", label: "Tree Inventory" },
    { id: "orchard-bins", label: "Harvest Bins" },
  ],
  vegetables: [
    { id: "vegetables", label: "Beds" },
    { id: "vegetables-successions", label: "Successions" },
  ],
  microgreens: [
    { id: "microgreens", label: "Batches" },
    { id: "microgreens-trays", label: "Trays" },
  ],
  "protected-cropping": [
    { id: "protected-cropping", label: "Structures" },
    { id: "protected-cropping-climate", label: "Climate Logs" },
    { id: "protected-cropping-fertigation", label: "Fertigation Events" },
  ],
  aquaponics: [
    { id: "aquaponics", label: "Systems" },
    { id: "aquaponics-fish", label: "Fish Stocks" },
    { id: "aquaponics-water", label: "Water Quality" },
    { id: "aquaponics-feeding", label: "Feeding Events" },
    { id: "aquaponics-yields", label: "Plant Yields" },
  ],
  "cattle-dairy": [
    { id: "cattle-dairy", label: "Cows" },
    { id: "cattle-dairy-milk", label: "Milk Records" },
    { id: "cattle-dairy-health", label: "Health Events" },
  ],
  "cattle-beef": [
    { id: "cattle-beef", label: "Mobs" },
    { id: "cattle-beef-weight", label: "Weight Records" },
    { id: "cattle-beef-drafting", label: "Draftings" },
  ],
  sheep: [
    { id: "sheep", label: "Flocks" },
    { id: "sheep-lambing", label: "Lambing" },
    { id: "sheep-drenching", label: "Drenching" },
    { id: "sheep-shearing", label: "Shearing" },
  ],
  goats: [
    { id: "goats", label: "Herds" },
    { id: "goats-milk", label: "Milk Records" },
    { id: "goats-fibre", label: "Fibre Records" },
  ],
  deer: [
    { id: "deer", label: "Herds" },
    { id: "deer-velvet", label: "Velvet Records" },
    { id: "deer-venison", label: "Venison Records" },
  ],
  pigs: [
    { id: "pigs", label: "Sows" },
    { id: "pigs-litters", label: "Litters" },
    { id: "pigs-feed", label: "Feed Records" },
  ],
  poultry: [
    { id: "poultry", label: "Flocks" },
    { id: "poultry-eggs", label: "Egg Records" },
    { id: "poultry-mortality", label: "Mortality Records" },
  ],
  bees: [
    { id: "bees", label: "Hives" },
    { id: "bees-inspections", label: "Inspections" },
    { id: "bees-honey", label: "Honey Harvests" },
  ],
  pasture: [
    { id: "pasture", label: "Paddocks" },
    { id: "pasture-rotations", label: "Rotations" },
    { id: "pasture-cover", label: "Cover Records" },
  ],
};

/**
 * Get locale-aware adapter for a module.
 * Returns column definitions with locale-aware formatters and dynamic regulatory labels.
 */
export function getLocaleAwareAdapter(moduleId: string, locale: string | undefined, chemicalRegLabel?: string, traceabilityTagLabel?: string): ModuleAdapter | null {
  const baseAdapter = MODULE_ADAPTERS[moduleId];
  if (!baseAdapter) return null;

  const fmtDate = createDateFormatter(locale);
  const fmtNum = createNumberFormatter(locale);

  // Update columns with formatters
  const columns = baseAdapter.columns.map((col) => {
    if (col.type === "date") return { ...col, format: fmtDate };
    if (col.type === "number") return { ...col, format: fmtNum };
    return col;
  });

  // For pest-spray-log, update the registration label if a custom one is provided
  let formFields = baseAdapter.formFields;
  if (moduleId === "pest-spray-log" && chemicalRegLabel) {
    formFields = baseAdapter.formFields.map((field) => {
      if (field.key === "registrationNo") {
        return { ...field, label: chemicalRegLabel };
      }
      return field;
    });
    // Also update the column label
    const regColIndex = columns.findIndex((c) => c.key === "registrationNo");
    if (regColIndex >= 0) {
      columns[regColIndex] = { ...columns[regColIndex], label: chemicalRegLabel };
    }
  }

  // For livestock traceability, use the country profile's scheme-specific tag
  // terminology (e.g. "NAIT Number" for NZ, "NLIS Device ID" for AU)
  if (moduleId === "livestock-traceability" && traceabilityTagLabel) {
    formFields = formFields.map((field) =>
      field.key === "tagNumbers" ? { ...field, label: traceabilityTagLabel } : field
    );
    const tagColIndex = columns.findIndex((c) => c.key === "tagNumbers");
    if (tagColIndex >= 0) {
      columns[tagColIndex] = { ...columns[tagColIndex], label: traceabilityTagLabel };
    }
  }

  return {
    ...baseAdapter,
    columns,
    formFields,
  };
}