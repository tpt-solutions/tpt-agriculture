import { integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { farms } from "./farm.js";

// ─── Field Management ─────────────────────────────────────────────────────────

export const fields = sqliteTable("fields", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  areaHa: real("area_ha").notNull(),
  soilType: text("soil_type"),
  irrigationZone: text("irrigation_zone"),
  coordinates: text("coordinates", { mode: "json" }).$type<object>(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const plots = sqliteTable("plots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fieldId: text("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  row: integer("row"),
  col: integer("col"),
  areaSqm: real("area_sqm"),
  notes: text("notes"),
});

// ─── Crop Planning ────────────────────────────────────────────────────────────

export const cropPlans = sqliteTable("crop_plans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  fieldId: text("field_id").references(() => fields.id, { onDelete: "set null" }),
  cropVariety: text("crop_variety").notNull(),
  plannedPlantDate: integer("planned_plant_date", { mode: "timestamp" }).notNull(),
  plannedHarvestDate: integer("planned_harvest_date", { mode: "timestamp" }),
  actualPlantDate: integer("actual_plant_date", { mode: "timestamp" }),
  actualHarvestDate: integer("actual_harvest_date", { mode: "timestamp" }),
  status: text("status").notNull().default("PLANNED"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const plantingTasks = sqliteTable("planting_tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cropPlanId: text("crop_plan_id").notNull().references(() => cropPlans.id, { onDelete: "cascade" }),
  taskType: text("task_type").notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  assignedTo: text("assigned_to"),
  notes: text("notes"),
});

// ─── Harvest Tracking ─────────────────────────────────────────────────────────

export const harvestBatches = sqliteTable("harvest_batches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  fieldId: text("field_id").references(() => fields.id, { onDelete: "set null" }),
  cropVariety: text("crop_variety").notNull(),
  harvestDate: integer("harvest_date", { mode: "timestamp" }).notNull(),
  totalYieldKg: real("total_yield_kg").notNull(),
  gradeBreakdown: text("grade_breakdown", { mode: "json" }).$type<Record<string, number>>(),
  lotNumber: text("lot_number"),
  buyer: text("buyer"),
  pricePerKg: real("price_per_kg"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const harvestRecords = sqliteTable("harvest_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id").notNull().references(() => harvestBatches.id, { onDelete: "cascade" }),
  plotId: text("plot_id").references(() => plots.id, { onDelete: "set null" }),
  yieldKg: real("yield_kg").notNull(),
  grade: text("grade"),
  notes: text("notes"),
});

// ─── Pest & Spray Log ─────────────────────────────────────────────────────────

export const chemicals = sqliteTable("chemicals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  activeIngredient: text("active_ingredient"),
  registrationNo: text("registration_no"),
  withholdingPeriodDays: integer("withholding_period_days"),
  safetyNotes: text("safety_notes"),
  hazardClass: text("hazard_class"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const fertiliserApplications = sqliteTable("fertiliser_applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  fieldId: text("field_id").references(() => fields.id, { onDelete: "set null" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  productType: text("product_type"),
  rateKgHa: real("rate_kg_ha"),
  totalKg: real("total_kg"),
  method: text("method"),
  operator: text("operator"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sprayEvents = sqliteTable("spray_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  fieldId: text("field_id").references(() => fields.id, { onDelete: "set null" }),
  chemicalId: text("chemical_id").references(() => chemicals.id, { onDelete: "set null" }),
  applicationDate: integer("application_date", { mode: "timestamp" }).notNull(),
  ratePerHa: real("rate_per_ha"),
  totalVolumeLitres: real("total_volume_litres"),
  operator: text("operator"),
  weatherConditions: text("weather_conditions"),
  windSpeedKph: real("wind_speed_kph"),
  tempC: real("temp_c"),
  withholdingEndDate: integer("withholding_end_date", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Viticulture ──────────────────────────────────────────────────────────────

export const vitBlocks = sqliteTable("vit_blocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  variety: text("variety").notNull(),
  areaHa: real("area_ha").notNull(),
  rowCount: integer("row_count"),
  rootstock: text("rootstock"),
  yearPlanted: integer("year_planted"),
  trellisSystem: text("trellis_system"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const vintageRecords = sqliteTable(
  "vintage_records",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    blockId: text("block_id").notNull().references(() => vitBlocks.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    brixAtHarvest: real("brix_at_harvest"),
    phAtHarvest: real("ph_at_harvest"),
    taAtHarvest: real("ta_at_harvest"),
    yieldKg: real("yield_kg"),
    harvestDate: integer("harvest_date", { mode: "timestamp" }),
    winemaker: text("winemaker"),
    notes: text("notes"),
  },
  (t) => [unique().on(t.blockId, t.year)]
);

export const canopyNotes = sqliteTable("canopy_notes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockId: text("block_id").notNull().references(() => vitBlocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  shootLengthCm: real("shoot_length_cm"),
  lateralGrowth: text("lateral_growth"),
  leafAreaIndex: real("leaf_area_index"),
  observations: text("observations"),
  photos: text("photos", { mode: "json" }).$type<string[]>(),
});

// ─── Orchard ──────────────────────────────────────────────────────────────────

export const orchardBlocks = sqliteTable("orchard_blocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species").notNull(),
  variety: text("variety"),
  areaHa: real("area_ha"),
  yearPlanted: integer("year_planted"),
  rootstock: text("rootstock"),
  pollinatorVariety: text("pollinator_variety"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const treeInventory = sqliteTable("tree_inventory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockId: text("block_id").notNull().references(() => orchardBlocks.id, { onDelete: "cascade" }),
  treeCount: integer("tree_count").notNull(),
  treeSpacingM: real("tree_spacing_m"),
  rowSpacingM: real("row_spacing_m"),
  trainingSystem: text("training_system"),
  notes: text("notes"),
});

export const orchardHarvestBins = sqliteTable("orchard_harvest_bins", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockId: text("block_id").notNull().references(() => orchardBlocks.id, { onDelete: "cascade" }),
  harvestDate: integer("harvest_date", { mode: "timestamp" }).notNull(),
  binCount: integer("bin_count").notNull(),
  weightKg: real("weight_kg"),
  grade: text("grade"),
  coolstoreId: text("coolstore_id"),
  notes: text("notes"),
});

// ─── Vegetables ───────────────────────────────────────────────────────────────

export const vegBeds = sqliteTable("veg_beds", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  lengthM: real("length_m"),
  widthM: real("width_m"),
  indoor: integer("indoor", { mode: "boolean" }).notNull().default(false),
  soilMix: text("soil_mix"),
  irrigationType: text("irrigation_type"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const vegSuccessions = sqliteTable("veg_successions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bedId: text("bed_id").notNull().references(() => vegBeds.id, { onDelete: "cascade" }),
  cropVariety: text("crop_variety").notNull(),
  plantDate: integer("plant_date", { mode: "timestamp" }).notNull(),
  transplantDate: integer("transplant_date", { mode: "timestamp" }),
  expectedHarvestDate: integer("expected_harvest_date", { mode: "timestamp" }),
  actualHarvestDate: integer("actual_harvest_date", { mode: "timestamp" }),
  yieldKg: real("yield_kg"),
  seedSource: text("seed_source"),
  notes: text("notes"),
});

// ─── Microgreens ──────────────────────────────────────────────────────────────

export const microgreenBatches = sqliteTable("microgreen_batches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  variety: text("variety").notNull(),
  substrate: text("substrate"),
  trayCount: integer("tray_count").notNull(),
  traySizeCm: text("tray_size_cm"),
  seedingDate: integer("seeding_date", { mode: "timestamp" }).notNull(),
  expectedHarvestDate: integer("expected_harvest_date", { mode: "timestamp" }),
  actualHarvestDate: integer("actual_harvest_date", { mode: "timestamp" }),
  yieldGrams: real("yield_grams"),
  revenueNzd: real("revenue_nzd"),
  buyer: text("buyer"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const microgreenTrays = sqliteTable("microgreen_trays", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id").notNull().references(() => microgreenBatches.id, { onDelete: "cascade" }),
  trayNumber: integer("tray_number").notNull(),
  yieldGrams: real("yield_grams"),
  notes: text("notes"),
});

// ─── Protected Cropping ───────────────────────────────────────────────────────

export const structures = sqliteTable("structures", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  areaSqm: real("area_sqm").notNull(),
  yearBuilt: integer("year_built"),
  roofMaterial: text("roof_material"),
  heatingSystem: text("heating_system"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const climateLogs = sqliteTable("climate_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  structureId: text("structure_id").notNull().references(() => structures.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  tempMinC: real("temp_min_c"),
  tempMaxC: real("temp_max_c"),
  humidityPct: real("humidity_pct"),
  co2Ppm: integer("co2_ppm"),
  lightLux: integer("light_lux"),
  notes: text("notes"),
});

export const fertigationEvents = sqliteTable("fertigation_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  structureId: text("structure_id").notNull().references(() => structures.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  ec: real("ec"),
  ph: real("ph"),
  nutrients: text("nutrients", { mode: "json" }).$type<Record<string, number>>(),
  volumeLitres: real("volume_litres"),
  irrigationMins: integer("irrigation_mins"),
  notes: text("notes"),
});

// ─── Aquaponics ───────────────────────────────────────────────────────────────

export const aquaSystems = sqliteTable("aqua_systems", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  systemType: text("system_type").notNull(),
  fishTankLitres: real("fish_tank_litres"),
  growBedSqm: real("grow_bed_sqm"),
  pumpFlowLph: real("pump_flow_lph"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const fishStocks = sqliteTable("fish_stocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  systemId: text("system_id").notNull().references(() => aquaSystems.id, { onDelete: "cascade" }),
  species: text("species").notNull(),
  stockCount: integer("stock_count").notNull(),
  averageWeightG: real("average_weight_g"),
  stockDate: integer("stock_date", { mode: "timestamp" }).notNull(),
  source: text("source"),
  notes: text("notes"),
});

export const waterQualityLogs = sqliteTable("water_quality_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  systemId: text("system_id").notNull().references(() => aquaSystems.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  ph: real("ph"),
  ammoniaMgl: real("ammonia_mgl"),
  nitriteMgl: real("nitrite_mgl"),
  nitrateMgl: real("nitrate_mgl"),
  doMgl: real("do_mgl"),
  tempC: real("temp_c"),
  notes: text("notes"),
});

export const aquaFeedingEvents = sqliteTable("aqua_feeding_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  systemId: text("system_id").notNull().references(() => aquaSystems.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  feedType: text("feed_type"),
  amountG: real("amount_g").notNull(),
  notes: text("notes"),
});

export const aquaPlantYields = sqliteTable("aqua_plant_yields", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  systemId: text("system_id").notNull().references(() => aquaSystems.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  cropVariety: text("crop_variety").notNull(),
  yieldGrams: real("yield_grams").notNull(),
  bed: text("bed"),
  notes: text("notes"),
});

// ─── Forestry ────────────────────────────────────────────────────────────────

export const forestBlocks = sqliteTable("forest_blocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species").notNull(),
  areaHa: real("area_ha").notNull(),
  plantingDate: integer("planting_date", { mode: "timestamp" }),
  expectedHarvestYear: integer("expected_harvest_year"),
  stockingRate: integer("stocking_rate"),
  status: text("status").notNull().default("ESTABLISHING"),
  soilType: text("soil_type"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const forestPlantings = sqliteTable("forest_plantings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockId: text("block_id").notNull().references(() => forestBlocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  species: text("species").notNull(),
  seedlingsPlanted: integer("seedlings_planted").notNull(),
  areaHa: real("area_ha").notNull(),
  spacing: text("spacing"),
  supplier: text("supplier"),
  notes: text("notes"),
});

export const forestThinnings = sqliteTable("forest_thinnings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockId: text("block_id").notNull().references(() => forestBlocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  volumeM3: real("volume_m3").notNull(),
  areaHa: real("area_ha"),
  avgStemDiamCm: real("avg_stem_diam_cm"),
  harvester: text("harvester"),
  notes: text("notes"),
});

export const forestHarvests = sqliteTable("forest_harvests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockId: text("block_id").notNull().references(() => forestBlocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  volumeM3: real("volume_m3").notNull(),
  areaHa: real("area_ha"),
  avgStemDiamCm: real("avg_stem_diam_cm"),
  buyer: text("buyer"),
  pricePerM3: real("price_per_m3"),
  notes: text("notes"),
});

// ─── Mushroom Production ──────────────────────────────────────────────────────

export const mushroomRooms = sqliteTable("mushroom_rooms", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  roomType: text("room_type").notNull(),
  shelfCount: integer("shelf_count"),
  areaSqm: real("area_sqm"),
  climateControl: integer("climate_control", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const mushroomCrops = sqliteTable("mushroom_crops", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomId: text("room_id").notNull().references(() => mushroomRooms.id, { onDelete: "cascade" }),
  species: text("species").notNull(),
  substrateType: text("substrate_type"),
  spawnDate: integer("spawn_date", { mode: "timestamp" }).notNull(),
  spawnSource: text("spawn_source"),
  casingDate: integer("casing_date", { mode: "timestamp" }),
  firstHarvestDate: integer("first_harvest_date", { mode: "timestamp" }),
  lastHarvestDate: integer("last_harvest_date", { mode: "timestamp" }),
  totalYieldKg: real("total_yield_kg"),
  status: text("status").notNull().default("IN_CROP"),
  notes: text("notes"),
});

export const mushroomHarvests = sqliteTable("mushroom_harvests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cropId: text("crop_id").notNull().references(() => mushroomCrops.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  kg: real("kg").notNull(),
  grade: text("grade"),
  buyer: text("buyer"),
  pricePerKg: real("price_per_kg"),
  notes: text("notes"),
});
