export interface FarmTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  moduleIds: string[];
}

export const FARM_TEMPLATES: FarmTemplate[] = [
  {
    id: "dairy",
    name: "Dairy Farm",
    icon: "🐄",
    description: "Dairy cattle, pasture, spray log, financials, equipment, staff, compliance",
    moduleIds: [
      "cattle-dairy", "pasture", "field-management", "pest-spray-log",
      "financials", "input-prices", "output-prices", "equipment", "staff", "compliance",
      "soil-water", "inventory",
    ],
  },
  {
    id: "sheep",
    name: "Sheep Farm",
    icon: "🐑",
    description: "Flock management, pasture, drenching, shearing, wool records",
    moduleIds: [
      "sheep", "pasture", "pest-spray-log",
      "financials", "input-prices", "output-prices", "equipment", "staff",
    ],
  },
  {
    id: "beef",
    name: "Beef Farm",
    icon: "🐂",
    description: "Beef mobs, weight gain, drafting, pasture management",
    moduleIds: [
      "cattle-beef", "pasture", "pest-spray-log",
      "financials", "input-prices", "output-prices", "equipment",
    ],
  },
  {
    id: "cropping",
    name: "Cropping Farm",
    icon: "🌾",
    description: "Fields, crop planning, harvest tracking, vegetables, soil management",
    moduleIds: [
      "field-management", "crop-planning", "harvest-tracking", "pest-spray-log",
      "vegetables", "financials", "equipment", "soil-water",
    ],
  },
  {
    id: "mixed-livestock",
    name: "Mixed Livestock",
    icon: "🐏",
    description: "Multiple livestock types, pasture, financials — all livestock modules enabled",
    moduleIds: [
      "cattle-dairy", "cattle-beef", "sheep", "goats", "deer", "pigs", "poultry", "pasture",
      "pest-spray-log", "financials", "input-prices", "output-prices", "equipment",
    ],
  },
  {
    id: "mixed-horticulture",
    name: "Mixed Horticulture",
    icon: "🥬",
    description: "Fields, crops, vegetables, orchard, vineyard — all horticulture modules",
    moduleIds: [
      "field-management", "crop-planning", "harvest-tracking", "pest-spray-log",
      "viticulture", "orchard", "vegetables", "microgreens", "protected-cropping",
      "aquaponics", "financials", "equipment",
    ],
  },
  {
    id: "orchard-vineyard",
    name: "Orchard / Vineyard",
    icon: "🍇",
    description: "Orchard blocks, vineyard blocks, spray log, harvest bins, vintage records",
    moduleIds: [
      "orchard", "viticulture", "pest-spray-log",
      "financials", "equipment",
    ],
  },
  {
    id: "beekeeper",
    name: "Beekeeper",
    icon: "🐝",
    description: "Hive inspections, honey harvests, queen records, compliance",
    moduleIds: [
      "bees", "pasture", "financials", "compliance",
    ],
  },
  {
    id: "piggery",
    name: "Piggery",
    icon: "🐖",
    description: "Sow records, litters, feed conversion, financials",
    moduleIds: [
      "pigs", "financials", "equipment",
    ],
  },
  {
    id: "poultry",
    name: "Poultry Farm",
    icon: "🐔",
    description: "Flock batches, egg production, mortality, compliance",
    moduleIds: [
      "poultry", "financials", "equipment", "compliance",
    ],
  },
  {
    id: "forestry",
    name: "Forestry",
    icon: "🌲",
    description: "Forest blocks, plantings, thinning, harvest volumes",
    moduleIds: [
      "forestry", "financials", "equipment",
    ],
  },
  {
    id: "mushroom",
    name: "Mushroom Production",
    icon: "🍄",
    description: "Growing rooms, crops, flushes, harvests",
    moduleIds: [
      "mushroom", "financials",
    ],
  },
  {
    id: "nursery",
    name: "Plant Nursery",
    icon: "🌱",
    description: "Propagation beds, seedling trays, transplants, sales",
    moduleIds: [
      "nursery", "financials", "equipment",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    icon: "⚙️",
    description: "Start from scratch — choose exactly which modules you need",
    moduleIds: [],
  },
];
