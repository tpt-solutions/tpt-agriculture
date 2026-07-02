export type ModuleCategory = "horticulture" | "livestock" | "platform";

export interface ModuleMeta {
  name: string;
  category: ModuleCategory;
  description: string;
  /** Billing unit: "hectares" for outdoor, "sqm" for indoor, "included" for platform features */
  billingUnit: "hectares" | "sqm" | "included";
}

export const MODULE_REGISTRY: Record<string, ModuleMeta> = {
  // ─── Horticulture ───────────────────────────────────────────────────────────
  "field-management": {
    name: "Field Management",
    category: "horticulture",
    description: "Farm and field CRUD, soil types, irrigation zones, plot map",
    billingUnit: "hectares",
  },
  "crop-planning": {
    name: "Crop Planning",
    category: "horticulture",
    description: "Planting calendars, succession schedules, variety selection",
    billingUnit: "hectares",
  },
  "harvest-tracking": {
    name: "Harvest Tracking",
    category: "horticulture",
    description: "Yield entry, batch and lot records, grade tracking",
    billingUnit: "hectares",
  },
  "pest-spray-log": {
    name: "Pest & Spray Log",
    category: "horticulture",
    description: "Spray events, chemical register, withholding periods",
    billingUnit: "hectares",
  },
  viticulture: {
    name: "Viticulture",
    category: "horticulture",
    description: "Block and row management, canopy notes, brix tracking, vintage records",
    billingUnit: "hectares",
  },
  orchard: {
    name: "Orchard",
    category: "horticulture",
    description: "Tree inventory, rootstock records, spray programs, harvest bins",
    billingUnit: "hectares",
  },
  vegetables: {
    name: "Vegetables",
    category: "horticulture",
    description: "Bed and row tracking, transplant records, succession planting",
    billingUnit: "hectares",
  },
  microgreens: {
    name: "Microgreens",
    category: "horticulture",
    description: "Tray tracking, 7–14 day grow cycles, variety + substrate, yield and revenue per batch",
    billingUnit: "sqm",
  },
  "protected-cropping": {
    name: "Protected Cropping",
    category: "horticulture",
    description: "Greenhouse and tunnel structure records, climate log, fertigation schedules",
    billingUnit: "sqm",
  },
  aquaponics: {
    name: "Aquaponics",
    category: "horticulture",
    description: "Fish stock and grow beds, water quality (pH/ammonia/nitrate/DO), feeding schedules, plant bed yields",
    billingUnit: "sqm",
  },

  // ─── Livestock ──────────────────────────────────────────────────────────────
  "cattle-dairy": {
    name: "Dairy Cattle",
    category: "livestock",
    description: "Individual cow records, milk production, somatic cell counts, drying off",
    billingUnit: "hectares",
  },
  "cattle-beef": {
    name: "Beef Cattle",
    category: "livestock",
    description: "Mob tracking, weight gain records, drafting and finishing targets",
    billingUnit: "hectares",
  },
  sheep: {
    name: "Sheep",
    category: "livestock",
    description: "Flock records, lambing %, drenching schedule, shearing and wool records",
    billingUnit: "hectares",
  },
  goats: {
    name: "Goats",
    category: "livestock",
    description: "Herd records, milking records, fibre tracking",
    billingUnit: "hectares",
  },
  deer: {
    name: "Deer",
    category: "livestock",
    description: "Velvet records, stag and hind management, venison processing records",
    billingUnit: "hectares",
  },
  pigs: {
    name: "Pigs",
    category: "livestock",
    description: "Sow records, litter tracking, feed conversion",
    billingUnit: "hectares",
  },
  poultry: {
    name: "Poultry",
    category: "livestock",
    description: "Flock batch cycles, egg production log, mortality, biosecurity records",
    billingUnit: "hectares",
  },
  bees: {
    name: "Beekeeping",
    category: "livestock",
    description: "Hive inspection log, honey harvest, varroa treatment, queen records",
    billingUnit: "hectares",
  },
  pasture: {
    name: "Pasture",
    category: "livestock",
    description: "Paddock rotation planner, pasture cover measurement, feed budget",
    billingUnit: "hectares",
  },

  // ─── Platform ───────────────────────────────────────────────────────────────
  financials: {
    name: "Financials",
    category: "platform",
    description: "Income and expense ledger, ROI per enterprise, GST summary",
    billingUnit: "included",
  },
  "input-prices": {
    name: "Input Prices",
    category: "platform",
    description: "Feed, chemical and seed cost per unit — feeds ROI calculations in Financials",
    billingUnit: "included",
  },
  "output-prices": {
    name: "Output Prices",
    category: "platform",
    description: "Wool, milk and produce price per unit — feeds ROI calculations in Financials",
    billingUnit: "included",
  },
  inventory: {
    name: "Inventory",
    category: "platform",
    description: "Chemical, seed, feed and fertiliser stock; movements; low-stock alerts",
    billingUnit: "included",
  },
  equipment: {
    name: "Equipment",
    category: "platform",
    description: "Asset register, maintenance log, WOF and COF reminders",
    billingUnit: "included",
  },
  weather: {
    name: "Weather",
    category: "platform",
    description: "Open-Meteo integration, daily weather log, spray window calculator",
    billingUnit: "included",
  },
  compliance: {
    name: "Compliance",
    category: "platform",
    description: "Regulatory checklist per country profile, audit-ready document store",
    billingUnit: "included",
  },
  staff: {
    name: "Staff",
    category: "platform",
    description: "Staff roster, timesheets, task assignment, contractor records",
    billingUnit: "included",
  },
  "soil-water": {
    name: "Soil & Water",
    category: "platform",
    description: "Soil test records, nutrient budget, irrigation log",
    billingUnit: "included",
  },
  "decision-support": {
    name: "Decision Support",
    category: "platform",
    description: "Rules-based advisory combining soil, weather, and financial data",
    billingUnit: "included",
  },
};
