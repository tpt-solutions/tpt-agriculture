// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import * as schema from "@tpt/core/schema";
import type { ModuleAdapter } from "./module-adapter.js";

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
      { key: "soilType", label: "Soil Type", type: "text" },
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
      { key: "cropVariety", label: "Crop / Variety", type: "text", required: true },
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
      { key: "cropVariety", label: "Crop / Variety", type: "text", required: true },
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
      { key: "variety", label: "Variety", type: "text", required: true },
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
      { key: "species", label: "Species", type: "text", required: true },
      { key: "variety", label: "Variety", type: "text" },
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
      { key: "indoor", label: "Indoor", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
      { key: "soilMix", label: "Soil Mix", type: "text" },
      { key: "irrigationType", label: "Irrigation Type", type: "text" },
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
      { key: "variety", label: "Variety", type: "text", required: true },
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
      { key: "breed", label: "Breed", type: "text" },
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
      { key: "breed", label: "Breed", type: "text" },
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
      { key: "breed", label: "Breed", type: "text" },
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
      { key: "breed", label: "Breed", type: "text" },
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
      { key: "species", label: "Species", type: "text" },
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
      { key: "breed", label: "Breed", type: "text" },
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
      { key: "species", label: "Species", type: "text", required: true },
      { key: "breed", label: "Breed", type: "text" },
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
      { key: "hiveType", label: "Type", type: "text" },
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
      { key: "soilType", label: "Soil Type", type: "text" },
      { key: "grassType", label: "Grass Type", type: "text" },
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
};

/**
 * Get locale-aware adapter for a module.
 * Returns column definitions with locale-aware formatters and dynamic regulatory labels.
 */
export function getLocaleAwareAdapter(moduleId: string, locale: string | undefined, chemicalRegLabel?: string): ModuleAdapter | null {
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

  return {
    ...baseAdapter,
    columns,
    formFields,
  };
}