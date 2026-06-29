// Module groupings — used for feature-gating on the dashboard (no billing).
// A farm can enable any subset of modules; these groups serve as sensible defaults
// for the setup wizard ("I run horticulture", "I run livestock", "Both").

export type ModuleGroup = "HORTICULTURE" | "LIVESTOCK" | "FULL";

export const BUNDLE_MODULES: Record<ModuleGroup, string[]> = {
  HORTICULTURE: [
    "field-management",
    "crop-planning",
    "harvest-tracking",
    "pest-spray-log",
    "viticulture",
    "orchard",
    "vegetables",
    "microgreens",
    "protected-cropping",
    "aquaponics",
  ],
  LIVESTOCK: [
    "cattle-dairy",
    "cattle-beef",
    "sheep",
    "goats",
    "deer",
    "pigs",
    "poultry",
    "bees",
    "pasture",
  ],
  FULL: [
    "field-management",
    "crop-planning",
    "harvest-tracking",
    "pest-spray-log",
    "viticulture",
    "orchard",
    "vegetables",
    "microgreens",
    "protected-cropping",
    "aquaponics",
    "cattle-dairy",
    "cattle-beef",
    "sheep",
    "goats",
    "deer",
    "pigs",
    "poultry",
    "bees",
    "pasture",
    "financials",
    "inventory",
    "equipment",
    "weather",
    "compliance",
    "staff",
    "soil-water",
  ],
};
