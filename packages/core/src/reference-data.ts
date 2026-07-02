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
