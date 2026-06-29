import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useAuth } from "../auth/AuthContext.js";

interface ModuleCard {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
}

const MODULE_CARDS: ModuleCard[] = [
  { id: "field-management", name: "Field Management", description: "Farm and field CRUD, soil types, irrigation zones", category: "horticulture", path: "/modules/field-management" },
  { id: "crop-planning", name: "Crop Planning", description: "Planting calendars, succession schedules", category: "horticulture", path: "/modules/crop-planning" },
  { id: "harvest-tracking", name: "Harvest Tracking", description: "Yield entry, batch and lot records", category: "horticulture", path: "/modules/harvest-tracking" },
  { id: "pest-spray-log", name: "Pest & Spray Log", description: "Spray events, chemical register", category: "horticulture", path: "/modules/pest-spray-log" },
  { id: "viticulture", name: "Viticulture", description: "Block and row management, canopy notes", category: "horticulture", path: "/modules/viticulture" },
  { id: "orchard", name: "Orchard", description: "Tree inventory, rootstock records", category: "horticulture", path: "/modules/orchard" },
  { id: "vegetables", name: "Vegetables", description: "Bed and row tracking, transplant records", category: "horticulture", path: "/modules/vegetables" },
  { id: "microgreens", name: "Microgreens", description: "Tray tracking, grow cycles, yield and revenue", category: "horticulture", path: "/modules/microgreens" },
  { id: "protected-cropping", name: "Protected Cropping", description: "Greenhouse and tunnel structure records", category: "horticulture", path: "/modules/protected-cropping" },
  { id: "aquaponics", name: "Aquaponics", description: "Fish stock, water quality, feeding schedules", category: "horticulture", path: "/modules/aquaponics" },
  { id: "cattle-dairy", name: "Dairy Cattle", description: "Individual cow records, milk production", category: "livestock", path: "/modules/cattle-dairy" },
  { id: "cattle-beef", name: "Beef Cattle", description: "Mob tracking, weight gain records", category: "livestock", path: "/modules/cattle-beef" },
  { id: "sheep", name: "Sheep", description: "Flock records, lambing %, drenching, shearing", category: "livestock", path: "/modules/sheep" },
  { id: "goats", name: "Goats", description: "Herd records, milking, fibre tracking", category: "livestock", path: "/modules/goats" },
  { id: "deer", name: "Deer", description: "Velvet records, stag and hind management", category: "livestock", path: "/modules/deer" },
  { id: "pigs", name: "Pigs", description: "Sow records, litter tracking, feed conversion", category: "livestock", path: "/modules/pigs" },
  { id: "poultry", name: "Poultry", description: "Flock batch cycles, egg production log", category: "livestock", path: "/modules/poultry" },
  { id: "bees", name: "Beekeeping", description: "Hive inspection log, honey harvest", category: "livestock", path: "/modules/bees" },
  { id: "pasture", name: "Pasture", description: "Paddock rotation planner, pasture cover", category: "livestock", path: "/modules/pasture" },
];

const CATEGORY_LABELS: Record<string, string> = {
  horticulture: "Horticulture",
  livestock: "Livestock",
};

const CATEGORY_COLORS: Record<string, string> = {
  horticulture: "bg-green-50 border-green-200 hover:bg-green-100",
  livestock: "bg-amber-50 border-amber-200 hover:bg-amber-100",
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data: farmData } = useQuery({
    queryKey: ["farm", user?.farmId],
    queryFn: async () => {
      if (!user) return null;
      const db = await getDb();
      const [farm] = await db
        .select()
        .from(farms)
        .where(eq(farms.id, user.farmId))
        .limit(1);
      return farm;
    },
    enabled: !!user,
  });

  const grouped = MODULE_CARDS.reduce<Record<string, ModuleCard[]>>(
    (acc, card) => {
      (acc[card.category] ??= []).push(card);
      return acc;
    },
    {}
  );

  return (
    <DashboardShell title={`Welcome to ${farmData?.name ?? user?.farmName ?? "your farm"}`}>
      {Object.entries(grouped).map(([category, cards]) => (
        <div key={category} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.id}
                to={card.path}
                className={`rounded-lg border p-4 transition-colors ${CATEGORY_COLORS[category] ?? "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
              >
                <div className="text-sm font-semibold text-gray-800">
                  {card.name}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {card.description}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </DashboardShell>
  );
}
