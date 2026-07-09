/**
 * Default value lists for reference-data form fields (breed, species, variety,
 * irrigation type, soil type, etc.). Farmers can add their own values on top
 * of these via the `custom_options` table — these are just starter lists.
 */
export const DEFAULT_OPTIONS: Record<string, string[]> = {
  "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Chalk"],

  "irrigation-type": ["Drip", "Sprinkler", "Flood", "Overhead", "Pivot", "None"],

  "crop-variety": [
    "Potato",
    "Wheat",
    "Barley",
    "Maize",
    "Onion",
    "Carrot",
    "Broccoli",
    "Cauliflower",
    "Cabbage",
    "Pumpkin",
    "Sweetcorn",
    "Peas",
  ],

  "orchard-species": [
    "Apple",
    "Pear",
    "Cherry",
    "Plum",
    "Peach",
    "Nectarine",
    "Apricot",
    "Feijoa",
    "Citrus",
    "Avocado",
    "Kiwifruit",
  ],

  "orchard-variety": [
    "Gala",
    "Royal Gala",
    "Braeburn",
    "Granny Smith",
    "Golden Delicious",
    "Fuji",
    "Pink Lady",
    "Bartlett",
    "Doyenne du Comice",
  ],

  "grape-variety": [
    "Sauvignon Blanc",
    "Pinot Noir",
    "Chardonnay",
    "Merlot",
    "Cabernet Sauvignon",
    "Riesling",
    "Syrah",
    "Pinot Gris",
  ],

  "microgreens-variety": [
    "Broccoli",
    "Radish",
    "Pea Shoots",
    "Sunflower",
    "Mustard",
    "Kale",
    "Rocket",
    "Amaranth",
  ],

  "cattle-dairy-breed": [
    "Holstein Friesian",
    "Jersey",
    "Ayrshire",
    "Kiwicross",
    "Brown Swiss",
    "Montbeliarde",
    "Guernsey",
    "Normande",
    "Fleckvieh",
  ],

  "cattle-beef-breed": [
    "Angus",
    "Hereford",
    "Charolais",
    "Simmental",
    "Murray Grey",
    "Limousin",
    "Wagyu",
    "Brahman",
    "Santa Gertrudis",
    "Shorthorn",
    "Highland",
  ],

  "sheep-breed": [
    "Romney",
    "Merino",
    "Perendale",
    "Coopworth",
    "Suffolk",
    "Texel",
    "Dorper",
    "Dorset",
    "Border Leicester",
    "Corriedale",
    "Southdown",
    "Wiltshire",
  ],

  "goat-breed": ["Saanen", "Boer", "Angora", "Kiko", "Toggenburg", "Nubian", "Alpine", "LaMancha", "Cashmere"],

  "deer-species": ["Red Deer", "Wapiti/Elk", "Fallow", "Rusa", "White-tailed", "Reindeer"],

  "pig-breed": ["Large White", "Landrace", "Duroc", "Berkshire", "Hampshire", "Pietrain", "Tamworth", "Kunekune"],

  "poultry-species": ["Chicken", "Duck", "Turkey", "Quail", "Goose", "Guinea Fowl", "Pheasant"],

  "poultry-breed": [
    "Leghorn",
    "Rhode Island Red",
    "Sussex",
    "Plymouth Rock",
    "Isa Brown",
    "Orpington",
    "Australorp",
    "Wyandotte",
    "Hy-Line Brown",
  ],

  "bee-hive-type": ["Langstroth", "Warre", "Top Bar", "Flow Hive", "National", "WBC"],

  "forestry-species": [
    "Radiata Pine",
    "Douglas Fir",
    "Eucalyptus",
    "Pinus elliottii",
    "Pinus taeda",
    "Pinus caribaea",
    "Redwood (Sequoia sempervirens)",
    "Corsican Pine",
    "Japanese Cedar (Cryptomeria)",
    "Teak",
    "Mahogany",
    "Mixed Native",
    "Other",
  ],

  "forestry-status": ["ESTABLISHING", "GROWING", "THINNED", "READY", "HARVESTED", "CLEARED"],

  "mushroom-species": [
    "White Button (Agaricus bisporus)",
    "Brown / Swiss Brown / Cremini / Portobello",
    "Shiitake (Lentinula edodes)",
    "Oyster (Pleurotus ostreatus)",
    "King Oyster (Pleurotus eryngii)",
    "Enoki (Flammulina velutipes)",
    "Buna Shimeji (Hypsizygus tessellatus)",
    "Bunapi Shimeji",
    "Maitake / Hen of the Woods (Grifola frondosa)",
    "Lion's Mane (Hericium erinaceus)",
    "Wood Ear (Auricularia)",
    "Truffle (Tuber spp.)",
    "Other",
  ],

  "mushroom-substrate": ["Straw", "Compost", "Sawdust", "Hardwood Log", "Coffee Grounds", "Coco Coir", "Mixed", "Other"],

  "mushroom-status": ["IN_CROP", "HARVESTING", "COMPLETED", "ABANDONED"],

  "nursery-species": [
    "Vegetable Seedling",
    "Herb Seedling",
    "Tree Sapling",
    "Ornamental",
    "Native Restoration",
    "Fruit Tree",
    "Perennial",
    "Other",
  ],

  "nursery-bed-type": ["Seedling Tray", "Propagation Bed", "Potting Bench", "Cold Frame", "Greenhouse", "Shade House", "Other"],

  "nursery-status": ["GERMINATING", "GROWING", "HARDENING_OFF", "READY", "TRANSPLANTED", "CULLED"],

  "ledger-category": ["Feed", "Chemical", "Seed", "Fertiliser", "Fuel", "Labour", "Sales", "Repairs & Maintenance", "Other"],

  "input-price-category": ["Feed", "Chemical", "Seed", "Fertiliser", "Fuel", "Other"],

  "output-price-category": ["Wool", "Milk", "Meat", "Produce", "Eggs", "Honey", "Other"],

  "inventory-category": ["Chemical", "Seed", "Feed", "Fertiliser", "Fuel", "Packaging", "Equipment Parts", "Other"],

  "equipment-type": ["Tractor", "Sprayer", "Harvester", "Trailer", "ATV/Quad", "Truck", "Pump", "Irrigation", "Other Machinery"],

  "compliance-category": ["Environmental", "Chemical Use", "Animal Welfare", "Food Safety", "Health & Safety", "Biosecurity", "Record Keeping", "Licensing", "Other"],

  "staff-role": ["Farm Manager", "Farm Hand", "Tractor Driver", "Irrigator", "Spray Operator", "Harvester", "Shepherd", "Milker", "Contractor", "Other"],

  "fertiliser-type": [
    "Urea",
    "DAP",
    "Superphosphate",
    "Lime",
    "Potash (Muriate of Potash)",
    "Compost",
    "Blood & Bone",
    "Ammonium Sulphate",
    "Farmyard Manure",
    "Other",
  ],

  "feed-type": ["Silage", "Hay", "Baleage", "Grain", "Pellets", "Molasses", "Pasture", "Concentrate", "Meal", "Other"],

  "treatment-type": [
    "Drench",
    "Vaccination",
    "Antibiotic",
    "Mineral Supplement",
    "Dip / Pour-on",
    "Hoof Trim",
    "Anti-inflammatory",
    "Other",
  ],

  "pasture-species": [
    "Perennial Ryegrass",
    "White Clover",
    "Red Clover",
    "Plantain",
    "Chicory",
    "Lucerne (Alfalfa)",
    "Timothy",
    "Cocksfoot",
    "Kikuyu",
    "Mixed Pasture",
  ],

  "unit-of-measure": ["kg", "L", "ha", "head", "bale", "tonne", "m³", "g", "each"],

  "movement-type": ["IN", "OUT", "ADJUST"],
};

/**
 * Per-country preferred reference options.
 * Keys are country profile IDs; values are partial maps of listKey → preferred options
 * relevant to that country. Falls back to the global DEFAULT_OPTIONS for any key not
 * listed here, so only country-specific overrides need entries.
 */
export const COUNTRY_OPTIONS: Record<string, Partial<Record<string, string[]>>> = {
  nz: {
    "crop-variety": ["Potato", "Wheat", "Barley", "Maize", "Onion", "Carrot", "Broccoli", "Cauliflower", "Pumpkin", "Sweetcorn", "Peas", "Kiwifruit", "Feijoa", "Avocado", "Squash", "Kale", "Silverbeet"],
    "cattle-dairy-breed": ["Holstein Friesian", "Jersey", "Kiwicross", "Ayrshire", "Brown Swiss", "KiwiCross", "Montbeliarde"],
    "cattle-beef-breed": ["Angus", "Hereford", "Charolais", "Simmental", "Murray Grey", "Wagyu", "Shorthorn", "Highland"],
    "sheep-breed": ["Romney", "Merino", "Perendale", "Coopworth", "Suffolk", "Texel", "Dorper", "Corriedale", "Border Leicester", "Southdown", "Wiltshire"],
    "orchard-species": ["Apple", "Pear", "Cherry", "Plum", "Feijoa", "Citrus", "Avocado", "Kiwifruit", "Nashi", "Olive"],
    "grape-variety": ["Sauvignon Blanc", "Pinot Noir", "Chardonnay", "Merlot", "Cabernet Sauvignon", "Riesling", "Syrah", "Pinot Gris", "Gewürztraminer"],
    "pasture-species": ["Perennial Ryegrass", "White Clover", "Red Clover", "Plantain", "Chicory", "Lucerne (Alfalfa)", "Timothy", "Cocksfoot", "Kikuyu", "Brown Top", "Yorkshire Fog"],
    "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Chalk", "Volcanic", "Pumice", "Allophanic"],
    "bee-hive-type": ["Langstroth", "Warre", "Top Bar", "Flow Hive", "National"],
  },
  au: {
    "cattle-beef-breed": ["Angus", "Hereford", "Charolais", "Murray Grey", "Simmental", "Brahman", "Santa Gertrudis", "Shorthorn", "Wagyu", "Brangus", "Droughtmaster"],
    "cattle-dairy-breed": ["Holstein Friesian", "Jersey", "Ayrshire", "Brown Swiss", "Illawarra", "Guernsey"],
    "sheep-breed": ["Merino", "Dorper", "Suffolk", "White Dorper", "Damara", "Poll Dorset", "Texel", "Border Leicester", "Corriedale"],
    "grape-variety": ["Shiraz", "Cabernet Sauvignon", "Chardonnay", "Merlot", "Sauvignon Blanc", "Pinot Noir", "Riesling", "Semillon", "Grenache"],
    "orchard-species": ["Apple", "Pear", "Cherry", "Plum", "Peach", "Nectarine", "Apricot", "Citrus", "Avocado", "Mango", "Banana", "Macadamia"],
    "crop-variety": ["Wheat", "Barley", "Maize", "Sorghum", "Cotton", "Rice", "Sugarcane", "Lupin", "Canola", "Chickpea", "Lentil", "Mung Bean"],
    "pasture-species": ["Perennial Ryegrass", "White Clover", "Lucerne (Alfalfa)", "Rhodes Grass", "Buffel Grass", "Kikuyu", "Panic", "Tall Fescue", "Phalaris"],
    "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Chalk", "Krasnozem", "Vertosol", "Sodosol"],
  },
  us: {
    "cattle-beef-breed": ["Angus", "Hereford", "Charolais", "Simmental", "Limousin", "Brahman", "Brangus", "Gelbvieh", "Red Angus", "Wagyu", "Longhorn"],
    "cattle-dairy-breed": ["Holstein Friesian", "Jersey", "Ayrshire", "Brown Swiss", "Guernsey", "Milking Shorthorn"],
    "sheep-breed": ["Suffolk", "Dorper", "Hampshire", "Texel", "Merino", "Katahdin", "Southdown", "Corriedale", "Columbia", "Rambouillet"],
    "crop-variety": ["Maize", "Soybean", "Wheat", "Cotton", "Rice", "Sorghum", "Barley", "Oat", "Canola", "Sunflower", "Alfalfa", "Sugarbeet"],
    "orchard-species": ["Apple", "Pear", "Cherry", "Peach", "Nectarine", "Apricot", "Plum", "Citrus", "Avocado", "Almond", "Pecan", "Walnut"],
    "grape-variety": ["Cabernet Sauvignon", "Chardonnay", "Merlot", "Pinot Noir", "Zinfandel", "Syrah", "Sauvignon Blanc", "Riesling", "Pinot Grigio", "Concord"],
    "pasture-species": ["Tall Fescue", "Kentucky Bluegrass", "Perennial Ryegrass", "White Clover", "Red Clover", "Bermudagrass", "Timothy", "Orchardgrass", "Alfalfa"],
    "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Chalk", "Mollisol", "Alfisol", "Ultisol"],
  },
  uk: {
    "cattle-beef-breed": ["Angus", "Hereford", "Charolais", "Simmental", "Limousin", "South Devon", "Sussex", "Highland", "Belted Galloway", "Longhorn"],
    "cattle-dairy-breed": ["Holstein Friesian", "Jersey", "Ayrshire", "Guernsey", "Shorthorn", "British Friesian"],
    "sheep-breed": ["Suffolk", "Texel", "Charollais", "Mule", "Swaledale", "Scottish Blackface", "Cheviot", "Bluefaced Leicester", "Lleyn", "Welsh Mountain", "Herdwick"],
    "crop-variety": ["Wheat", "Barley", "Oat", "Oilseed Rape", "Potato", "Sugarbeet", "Field Bean", "Peas"],
    "orchard-species": ["Apple", "Pear", "Cherry", "Plum", "Damson", "Cobnut"],
    "pasture-species": ["Perennial Ryegrass", "White Clover", "Timothy", "Cocksfoot", "Tall Fescue", "Meadow Fescue", "Red Clover", "Alsike Clover"],
  },
  za: {
    "cattle-beef-breed": ["Angus", "Hereford", "Brahman", "Bonsmara", "Simmentaler", "Charolais", "Sussex", "Afrikaner", "Nguni", "Drakensberger"],
    "sheep-breed": ["Merino", "Dorper", "South African Mutton Merino", "Suffolk", "Dohne Merino", "Van Rooy"],
    "crop-variety": ["Maize", "Wheat", "Sugarcane", "Sunflower", "Cotton", "Sorghum", "Soybean", "Grapes", "Citrus", "Deciduous Fruit"],
    "grape-variety": ["Chenin Blanc", "Cabernet Sauvignon", "Shiraz", "Pinotage", "Sauvignon Blanc", "Chardonnay", "Merlot", "Pinot Noir"],
    "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Laterite", "Avalon", "Hutton", "Glenrosa"],
  },
  ca: {
    "cattle-beef-breed": ["Angus", "Hereford", "Charolais", "Simmental", "Limousin", "Gelbvieh", "Blonde d'Aquitaine", "Salers", "Speckle Park"],
    "cattle-dairy-breed": ["Holstein Friesian", "Jersey", "Ayrshire", "Brown Swiss", "Guernsey", "Canadian"],
    "crop-variety": ["Wheat", "Canola", "Barley", "Oat", "Maize", "Soybean", "Flax", "Peas", "Lentil", "Chickpea", "Mustard", "Sugarbush"],
    "pasture-species": ["Timothy", "Alfalfa", "Clover", "Tall Fescue", "Perennial Ryegrass", "Meadow Brome", "Crested Wheatgrass"],
    "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Chalk", "Chernozem", "Luvisol", "Podzol"],
  },
  in: {
    "cattle-beef-breed": ["Gir", "Sahiwal", "Hariana", "Kankrej", "Ongole", "Tharparkar"],
    "cattle-dairy-breed": ["Sahiwal", "Gir", "Red Sindhi", "Tharparkar", "Murrah Buffalo", "Mehsana Buffalo"],
    "crop-variety": ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Tea", "Coffee", "Potato", "Onion", "Pulses", "Millet", "Groundnut", "Oilseed"],
    "orchard-species": ["Mango", "Banana", "Citrus", "Guava", "Pomegranate", "Papaya", "Litchi", "Cashew", "Coconut", "Arecanut"],
    "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Alluvial", "Black", "Red", "Laterite", "Arid", "Forest"],
  },
  br: {
    "cattle-beef-breed": ["Nelore", "Angus", "Hereford", "Brahma", "Guzerá", "Canchim", "Santa Gertrudis", "Brangus", "Senepol"],
    "cattle-dairy-breed": ["Holstein Friesian", "Jersey", "Gir", "Guzerá", "Sindi"],
    "crop-variety": ["Sugarcane", "Soybean", "Maize", "Cotton", "Coffee", "Rice", "Wheat", "Beans", "Cassava", "Oranges", "Tobacco"],
    "orchard-species": ["Orange", "Banana", "Apple", "Papaya", "Mango", "Avocado", "Grapes", "Coconut", "Passion Fruit", "Guava"],
    "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Latosol", "Argissolo", "Nitossolo"],
  },
  fr: {
    "cattle-beef-breed": ["Charolais", "Limousin", "Blonde d'Aquitaine", "Salers", "Aubrac", "Parthenaise", "Gasconne"],
    "cattle-dairy-breed": ["Holstein Friesian", "Normande", "Montbeliarde", "Abondance", "Tarentaise", "Prim'Holstein"],
    "sheep-breed": ["Berrichon", "Ile de France", "Charollais", "Lacaune", "Suffolk", "Texel", "Manech", "Corse"],
    "grape-variety": ["Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah", "Chardonnay", "Sauvignon Blanc", "Riesling", "Grenache", "Cinsault", "Mourvèdre"],
    "crop-variety": ["Wheat", "Barley", "Maize", "Sunflower", "Oilseed Rape", "Sugarbeet", "Potato", "Flax", "Triticale"],
    "orchard-species": ["Apple", "Pear", "Cherry", "Plum", "Peach", "Apricot", "Walnut", "Hazelnut"],
    "pasture-species": ["Perennial Ryegrass", "White Clover", "Timothy", "Tall Fescue", "Meadow Fescue", "Cocksfoot", "Lucerne (Alfalfa)"],
  },
  de: {
    "cattle-beef-breed": ["Angus", "Hereford", "Charolais", "Simmental", "Limousin", "Gelbvieh", "Fleckvieh", "Pinzgauer"],
    "cattle-dairy-breed": ["Holstein Friesian", "Fleckvieh", "Brown Swiss", "Jersey", "Deutsche Rotbunte"],
    "sheep-breed": ["Texel", "Suffolk", "Merinolandschaf", "Schwarzköpfiges Fleischschaf", "Charollais", "Weißes Alpenschaf"],
    "crop-variety": ["Wheat", "Barley", "Maize", "Oilseed Rape", "Sugarbeet", "Potato", "Rye", "Oat", "Triticale"],
    "orchard-species": ["Apple", "Pear", "Cherry", "Plum", "Greengage", "Mirabelle"],
    "grape-variety": ["Riesling", "Pinot Noir", "Pinot Gris", "Pinot Blanc", "Silvaner", "Chardonnay", "Dornfelder", "Sauvignon Blanc"],
    "pasture-species": ["Perennial Ryegrass", "White Clover", "Red Clover", "Timothy", "Meadow Fescue", "Cocksfoot", "Tall Fescue"],
    "soil-type": ["Clay", "Loam", "Sandy", "Silt", "Peat", "Chalk", "Parabraunerde", "Podzol", "Gley"],
  },
};

/**
 * Get default options for a reference list key, optionally filtered by country profile.
 * Returns the country-specific list when available, or the full global default list.
 */
export function getDefaultOptions(listKey: string, countryId?: string): string[] {
  const globalDefaults = DEFAULT_OPTIONS[listKey] ?? [];
  if (!countryId) return globalDefaults;
  const countryOverrides = COUNTRY_OPTIONS[countryId]?.[listKey];
  if (!countryOverrides) return globalDefaults;
  return countryOverrides;
}
