import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { farms } from "./farm.js";

// ─── Dairy Cattle ────────────────────────────────────────────────────────────

export const dairyCows = sqliteTable("dairy_cows", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  animalId: text("animal_id").notNull(),
  breed: text("breed"),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  sex: text("sex").notNull().default("FEMALE"),
  currentStatus: text("current_status").notNull().default("LACTATING"),
  calvingCount: integer("calving_count").notNull().default(0),
  lastCalvingDate: integer("last_calving_date", { mode: "timestamp" }),
  sire: text("sire"),
  dam: text("dam"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const dairyMilkRecords = sqliteTable("dairy_milk_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cowId: text("cow_id").notNull().references(() => dairyCows.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  liters: real("liters").notNull(),
  fatPct: real("fat_pct"),
  proteinPct: real("protein_pct"),
  scc: integer("scc"),
  comments: text("comments"),
});

export const dairyHealthEvents = sqliteTable("dairy_health_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cowId: text("cow_id").notNull().references(() => dairyCows.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  withdrawn: integer("withdrawn", { mode: "boolean" }).notNull().default(false),
  withdrawnUntil: integer("withdrawn_until", { mode: "timestamp" }),
});

// ─── Beef Cattle ─────────────────────────────────────────────────────────────

export const beefMobs = sqliteTable("beef_mobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  breed: text("breed"),
  headCount: integer("head_count").notNull(),
  location: text("location"),
  targetWeightKg: real("target_weight_kg"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const beefWeightRecords = sqliteTable("beef_weight_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  mobId: text("mob_id").notNull().references(() => beefMobs.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  avgWeightKg: real("avg_weight_kg").notNull(),
  sampleCount: integer("sample_count"),
  notes: text("notes"),
});

export const beefDraftings = sqliteTable("beef_draftings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  mobId: text("mob_id").notNull().references(() => beefMobs.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  headCount: integer("head_count").notNull(),
  avgWeightKg: real("avg_weight_kg").notNull(),
  destination: text("destination").notNull(),
  notes: text("notes"),
});

// ─── Sheep ───────────────────────────────────────────────────────────────────

export const sheepFlocks = sqliteTable("sheep_flocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  breed: text("breed"),
  headCount: integer("head_count").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sheepLambingRecords = sqliteTable("sheep_lambing_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  flockId: text("flock_id").notNull().references(() => sheepFlocks.id, { onDelete: "cascade" }),
  season: text("season").notNull(),
  ewesLambed: integer("ewes_lambed").notNull(),
  lambsBorn: integer("lambs_born").notNull(),
  lambsAlive: integer("lambs_alive").notNull(),
  lambingPct: real("lambing_pct"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  notes: text("notes"),
});

export const sheepDrenchingRecords = sqliteTable("sheep_drenching_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  flockId: text("flock_id").notNull().references(() => sheepFlocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  product: text("product").notNull(),
  doseMl: real("dose_ml"),
  headCount: integer("head_count").notNull(),
  withholdingMeat: integer("withholding_meat"),
  notes: text("notes"),
});

export const sheepShearingRecords = sqliteTable("sheep_shearing_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  flockId: text("flock_id").notNull().references(() => sheepFlocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  headCount: integer("head_count").notNull(),
  woolKg: real("wool_kg").notNull(),
  woolGrade: text("wool_grade"),
  buyer: text("buyer"),
  pricePerKg: real("price_per_kg"),
  notes: text("notes"),
});

// ─── Goats ───────────────────────────────────────────────────────────────────

export const goatHerds = sqliteTable("goat_herds", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  breed: text("breed"),
  headCount: integer("head_count").notNull(),
  type: text("type").notNull().default("DAIRY"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const goatMilkRecords = sqliteTable("goat_milk_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  herdId: text("herd_id").notNull().references(() => goatHerds.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  liters: real("liters").notNull(),
  butterfat: real("butterfat"),
  protein: real("protein"),
  comments: text("comments"),
});

export const goatFibreRecords = sqliteTable("goat_fibre_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  herdId: text("herd_id").notNull().references(() => goatHerds.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  fibreKg: real("fibre_kg").notNull(),
  fibreType: text("fibre_type"),
  grade: text("grade"),
  buyer: text("buyer"),
  pricePerKg: real("price_per_kg"),
  notes: text("notes"),
});

// ─── Deer ────────────────────────────────────────────────────────────────────

export const deerHerds = sqliteTable("deer_herds", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species"),
  headCount: integer("head_count").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const deerVelvetRecords = sqliteTable("deer_velvet_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  herdId: text("herd_id").notNull().references(() => deerHerds.id, { onDelete: "cascade" }),
  stagId: text("stag_id"),
  harvestDate: integer("harvest_date", { mode: "timestamp" }).notNull(),
  velvetKg: real("velvet_kg").notNull(),
  grade: text("grade"),
  buyer: text("buyer"),
  pricePerKg: real("price_per_kg"),
  notes: text("notes"),
});

export const deerVenisonRecords = sqliteTable("deer_venison_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  herdId: text("herd_id").notNull().references(() => deerHerds.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  headCount: integer("head_count").notNull(),
  carcassKg: real("carcass_kg").notNull(),
  grade: text("grade"),
  buyer: text("buyer"),
  pricePerKg: real("price_per_kg"),
  notes: text("notes"),
});

// ─── Pigs ────────────────────────────────────────────────────────────────────

export const pigSows = sqliteTable("pig_sows", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  animalId: text("animal_id").notNull(),
  breed: text("breed"),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  parityCount: integer("parity_count").notNull().default(0),
  status: text("status").notNull().default("ACTIVE"),
  sire: text("sire"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const pigLitters = sqliteTable("pig_litters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sowId: text("sow_id").notNull().references(() => pigSows.id, { onDelete: "cascade" }),
  farrowDate: integer("farrow_date", { mode: "timestamp" }).notNull(),
  pigletsBorn: integer("piglets_born").notNull(),
  pigletsAlive: integer("piglets_alive").notNull(),
  pigletsWeaned: integer("piglets_weaned"),
  weanDate: integer("wean_date", { mode: "timestamp" }),
  notes: text("notes"),
});

export const pigFeedRecords = sqliteTable("pig_feed_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  groupName: text("group_name").notNull(),
  headCount: integer("head_count").notNull(),
  feedType: text("feed_type").notNull(),
  feedKg: real("feed_kg").notNull(),
  costPerKg: real("cost_per_kg"),
  notes: text("notes"),
});

// ─── Poultry ─────────────────────────────────────────────────────────────────

export const poultryFlocks = sqliteTable("poultry_flocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  batchName: text("batch_name").notNull(),
  species: text("species").notNull(),
  breed: text("breed"),
  birdCount: integer("bird_count").notNull(),
  housedDate: integer("housed_date", { mode: "timestamp" }).notNull(),
  house: text("house"),
  purpose: text("purpose").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const poultryEggRecords = sqliteTable("poultry_egg_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  flockId: text("flock_id").notNull().references(() => poultryFlocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  eggCount: integer("egg_count").notNull(),
  grade: text("grade"),
  cracked: integer("cracked").notNull().default(0),
  comments: text("comments"),
});

export const poultryMortality = sqliteTable("poultry_mortality", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  flockId: text("flock_id").notNull().references(() => poultryFlocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  count: integer("count").notNull(),
  cause: text("cause"),
  notes: text("notes"),
});

// ─── Bees ────────────────────────────────────────────────────────────────────

export const beeHives = sqliteTable("bee_hives", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  hiveName: text("hive_name").notNull(),
  hiveType: text("hive_type"),
  location: text("location"),
  queenAge: integer("queen_age"),
  queenColor: text("queen_color"),
  origin: text("origin"),
  status: text("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const beeInspections = sqliteTable("bee_inspections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  hiveId: text("hive_id").notNull().references(() => beeHives.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  temperament: text("temperament"),
  queenSeen: integer("queen_seen", { mode: "boolean" }).notNull().default(true),
  eggsPresent: integer("eggs_present", { mode: "boolean" }).notNull().default(true),
  broodPattern: text("brood_pattern"),
  miteCount: integer("mite_count"),
  foodStores: text("food_stores"),
  diseaseSigns: text("disease_signs"),
  action: text("action"),
  notes: text("notes"),
});

export const beeHoneyHarvests = sqliteTable("bee_honey_harvests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  hiveId: text("hive_id").notNull().references(() => beeHives.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  kg: real("kg").notNull(),
  type: text("type"),
  grade: text("grade"),
  buyer: text("buyer"),
  pricePerKg: real("price_per_kg"),
  notes: text("notes"),
});

// ─── Pasture ─────────────────────────────────────────────────────────────────

export const paddocks = sqliteTable("paddocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  areaHa: real("area_ha").notNull(),
  soilType: text("soil_type"),
  grassType: text("grass_type"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const paddockRotations = sqliteTable("paddock_rotations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  paddockId: text("paddock_id").notNull().references(() => paddocks.id, { onDelete: "cascade" }),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  stockType: text("stock_type"),
  headCount: integer("head_count"),
  comments: text("comments"),
});

export const pastureCoverRecords = sqliteTable("pasture_cover_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  paddockId: text("paddock_id").notNull().references(() => paddocks.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  coverKgHa: real("cover_kg_ha").notNull(),
  method: text("method"),
  growthRate: real("growth_rate"),
  notes: text("notes"),
});

// ─── Livestock Traceability ──────────────────────────────────────────────────
// Onto/off-property movement register (NAIT for NZ, NLIS for AU, etc.). Farm-scoped
// directly rather than per-species, since a single movement event (e.g. a truck of
// stock leaving the farm) is recorded once regardless of which module the animals
// belong to.

export const livestockMovements = sqliteTable("livestock_movements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  farmId: text("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  species: text("species").notNull(),
  direction: text("direction").notNull(),
  headCount: integer("head_count").notNull(),
  tagNumbers: text("tag_numbers"),
  scheme: text("scheme").notNull(),
  counterpartyName: text("counterparty_name"),
  counterpartyPropertyId: text("counterparty_property_id"),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
