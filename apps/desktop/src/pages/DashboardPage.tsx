// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { getDb } from "@tpt/core";
import { farms, sprayEvents, chemicals, cropPlans } from "@tpt/core/schema";
import { eq, and, gt, asc } from "drizzle-orm";
import { useAuth } from "../auth/AuthContext.js";
import { MODULE_ADAPTERS } from "../modules/registry.js";
import { fetchWeather, getWeatherEmoji } from "../weather/weather-service.js";

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

interface UpcomingEvent {
  type: "withholding" | "harvest" | "planting";
  label: string;
  date: Date;
  detail: string;
  path: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const farmId = user?.farmId;

  const { data: farmData } = useQuery({
    queryKey: ["farm", farmId],
    queryFn: async () => {
      if (!farmId) return null;
      const db = await getDb();
      const [farm] = await db
        .select()
        .from(farms)
        .where(eq(farms.id, farmId))
        .limit(1);
      return farm;
    },
    enabled: !!farmId,
  });

  // Fetch weather data
  const { data: weatherData } = useQuery({
    queryKey: ["weather", farmData?.lat, farmData?.lon],
    queryFn: async () => {
      if (!farmData?.lat || !farmData?.lon) return null;
      const settings = farmData.settingsJson ?? {};
      const provider = (settings.weatherProvider as string) ?? "open-meteo";
      const customUrl = (settings.customWeatherUrl as string) ?? undefined;
      return fetchWeather(farmData.lat, farmData.lon, provider as "open-meteo" | "bom" | "met-office" | "noaa" | "custom", customUrl);
    },
    enabled: !!farmData?.lat && !!farmData?.lon,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch record counts for all modules
  const { data: recordCounts = {} } = useQuery({
    queryKey: ["module-counts", farmId],
    queryFn: async () => {
      if (!farmId) return {};
      const counts: Record<string, number> = {};
      const adapterEntries = Object.entries(MODULE_ADAPTERS);
      await Promise.all(
        adapterEntries.map(async ([id, adapter]) => {
          try {
            const items = await adapter.list(farmId);
            counts[id] = items.length;
          } catch {
            counts[id] = 0;
          }
        })
      );
      return counts;
    },
    enabled: !!farmId,
    staleTime: 30_000,
  });

  // Fetch upcoming events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["upcoming-events", farmId],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      const now = new Date();
      const events: UpcomingEvent[] = [];

      // Active withholding periods from spray events
      try {
        const activeWithholding = await db
          .select({
            id: sprayEvents.id,
            withholdingEndDate: sprayEvents.withholdingEndDate,
            chemicalId: sprayEvents.chemicalId,
          })
          .from(sprayEvents)
          .where(
            and(
              eq(sprayEvents.farmId, farmId),
              gt(sprayEvents.withholdingEndDate, now)
            )
          )
          .orderBy(asc(sprayEvents.withholdingEndDate))
          .limit(5);

        for (const sw of activeWithholding) {
          if (!sw.withholdingEndDate) continue;
          let chemicalName = "Unknown chemical";
          if (sw.chemicalId) {
            const [chem] = await db
              .select({ name: chemicals.name })
              .from(chemicals)
              .where(eq(chemicals.id, sw.chemicalId))
              .limit(1);
            if (chem) chemicalName = chem.name;
          }
          events.push({
            type: "withholding",
            label: "Withholding Period",
            date: sw.withholdingEndDate,
            detail: chemicalName,
            path: "/modules/pest-spray-log",
          });
        }
      } catch {
        // Table may not have data yet
      }

      // Upcoming planned harvests
      try {
        const upcomingHarvests = await db
          .select({
            id: cropPlans.id,
            cropVariety: cropPlans.cropVariety,
            plannedHarvestDate: cropPlans.plannedHarvestDate,
          })
          .from(cropPlans)
          .where(
            and(
              eq(cropPlans.farmId, farmId),
              gt(cropPlans.plannedHarvestDate, now),
              eq(cropPlans.status, "IN_PROGRESS")
            )
          )
          .orderBy(asc(cropPlans.plannedHarvestDate))
          .limit(5);

        for (const h of upcomingHarvests) {
          if (!h.plannedHarvestDate) continue;
          events.push({
            type: "harvest",
            label: "Planned Harvest",
            date: h.plannedHarvestDate,
            detail: h.cropVariety,
            path: "/modules/crop-planning",
          });
        }
      } catch {
        // Table may not have data yet
      }

      // Upcoming planned plantings
      try {
        const upcomingPlantings = await db
          .select({
            id: cropPlans.id,
            cropVariety: cropPlans.cropVariety,
            plannedPlantDate: cropPlans.plannedPlantDate,
          })
          .from(cropPlans)
          .where(
            and(
              eq(cropPlans.farmId, farmId),
              gt(cropPlans.plannedPlantDate, now),
              eq(cropPlans.status, "PLANNED")
            )
          )
          .orderBy(asc(cropPlans.plannedPlantDate))
          .limit(5);

        for (const p of upcomingPlantings) {
          if (!p.plannedPlantDate) continue;
          events.push({
            type: "planting",
            label: "Planned Planting",
            date: p.plannedPlantDate,
            detail: p.cropVariety,
            path: "/modules/crop-planning",
          });
        }
      } catch {
        // Table may not have data yet
      }

      // Sort all events by date and take the first 8
      events.sort((a, b) => a.date.getTime() - b.date.getTime());
      return events.slice(0, 8);
    },
    enabled: !!farmId,
    staleTime: 60_000,
  });

  const grouped = MODULE_CARDS.reduce<Record<string, ModuleCard[]>>(
    (acc, card) => {
      (acc[card.category] ??= []).push(card);
      return acc;
    },
    {}
  );

  function formatCount(count: number | undefined, label: string): string {
    if (count === undefined || count === 0) return "";
    return `${count} ${label}`;
  }

  const EVENT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
    withholding: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: "\u26A0" },
    harvest: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "\uD83C\uDF3E" },
    planting: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: "\uD83C\uDF31" },
  };

  return (
    <DashboardShell title={`Welcome to ${farmData?.name ?? user?.farmName ?? "your farm"}`}>
      {/* Weather Widget */}
      {weatherData && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <span className="text-2xl">{getWeatherEmoji(weatherData.weatherCode)}</span>
            <div>
              <div className="text-sm font-medium text-gray-800">
                {weatherData.temperature != null && (
                  <>{weatherData.temperature}°C</>
                )}
                {weatherData.windSpeed != null && (
                  <span className="ml-2 text-gray-600">{weatherData.windSpeed} kph wind</span>
                )}
              </div>
              <div className="text-xs text-gray-500">Current conditions</div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events Strip */}
      {upcomingEvents.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Upcoming Events
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingEvents.map((event, i) => {
              const style = EVENT_STYLES[event.type] ?? EVENT_STYLES.planting;
              return (
                <Link
                  key={i}
                  to={event.path}
                  className={`rounded-lg border p-3 transition-colors hover:opacity-80 ${style.bg}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{style.icon}</span>
                    <span className={`text-xs font-semibold ${style.text}`}>{event.label}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-800">{event.detail}</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {event.date.toLocaleDateString()}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([category, cards]) => (
        <div key={category} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const count = recordCounts[card.id];
              const countStr = formatCount(count, card.name.split(" ").pop() ?? card.name);
              return (
                <Link
                  key={card.id}
                  to={card.path}
                  className={`rounded-lg border p-4 transition-colors ${CATEGORY_COLORS[category] ?? "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">
                      {card.name}
                    </div>
                    {countStr && (
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {countStr}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {card.description}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </DashboardShell>
  );
}