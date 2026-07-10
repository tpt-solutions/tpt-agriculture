// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { farmTasks } from "@tpt/core/schema";
import { eq, and, gte } from "drizzle-orm";
import { useFarm } from "../farm/FarmContext.js";
import { useSettings } from "../context/FarmSettingsContext.js";
import { MODULE_ADAPTERS } from "../modules/registry.js";
import { fetchWeather, getWeatherEmoji } from "../weather/weather-service.js";
import { IncomeExpenseChart } from "../components/IncomeExpenseChart.js";
import { getReminders } from "../notifications/reminder-sources.js";
import type { ReminderItem } from "../notifications/reminder-sources.js";

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

// Platform tools are always visible — not gated by the horticulture/livestock module picker.
const PLATFORM_CARDS: ModuleCard[] = [
  { id: "financials", name: "Financials", description: "Income/expense ledger tagged by enterprise", category: "platform", path: "/modules/financials" },
  { id: "input-prices", name: "Input Prices", description: "Feed, chemical and seed cost per unit", category: "platform", path: "/modules/input-prices" },
  { id: "output-prices", name: "Output Prices", description: "Wool, milk and produce price per unit", category: "platform", path: "/modules/output-prices" },
  { id: "soil-water", name: "Soil & Water", description: "Soil test records, pH, nutrient levels", category: "platform", path: "/modules/soil-water" },
  { id: "inventory", name: "Inventory", description: "Chemical, seed, feed and fertiliser stock levels", category: "platform", path: "/modules/inventory" },
  { id: "equipment", name: "Equipment", description: "Asset register, maintenance log, WoF/CoF reminders", category: "platform", path: "/modules/equipment" },
  { id: "compliance", name: "Compliance", description: "Regulatory checklist per country profile", category: "platform", path: "/modules/compliance" },
  { id: "staff", name: "Staff", description: "Staff roster, timesheets, contractor records", category: "platform", path: "/modules/staff" },
  { id: "weather", name: "Weather & Spray Windows", description: "5-day hourly spray-window calculator", category: "platform", path: "/modules/weather" },
  { id: "decision-support", name: "Decision Support", description: "Rules-based farm advisory from your data", category: "platform", path: "/modules/decision-support" },
];

const CATEGORY_LABELS: Record<string, string> = {
  horticulture: "Horticulture",
  livestock: "Livestock",
  platform: "Financials & Pricing",
};

  const CATEGORY_COLORS: Record<string, string> = {
  horticulture: "bg-green-50 border-green-200 hover:bg-green-100",
  livestock: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  platform: "bg-blue-50 border-blue-200 hover:bg-blue-100",
};

const SETUP_NUDGES: Record<string, { label: string; path: string; description: string }> = {
  "pest-spray-log": { label: "Chemicals", path: "/modules/pest-spray-log", description: "No chemicals registered yet" },
  equipment: { label: "Equipment", path: "/modules/equipment", description: "No equipment assets registered yet" },
  compliance: { label: "Compliance", path: "/modules/compliance", description: "No compliance checks set up yet" },
  financials: { label: "Financials", path: "/modules/financials", description: "No financial records yet" },
  inventory: { label: "Inventory", path: "/modules/inventory", description: "No inventory items yet" },
  staff: { label: "Staff", path: "/modules/staff", description: "No staff members added yet" },
  "soil-water": { label: "Soil & Water", path: "/modules/soil-water", description: "No soil tests recorded yet" },
};


export function DashboardPage() {
  const { farmId, farmName } = useFarm();
  const settings = useSettings();

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

  // Fetch upcoming events from the shared reminders registry (excludes overdue items —
  // those surface via the notification bell instead of the dashboard strip)
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["upcoming-events", farmId, settings?.notifications],
    queryFn: async () => {
      if (!farmId || !settings) return [];
      const reminders = await getReminders(farmId, settings.notifications);
      return reminders.filter((r) => r.severity !== "overdue").slice(0, 8);
    },
    enabled: !!farmId && !!settings,
    staleTime: 60_000,
  });

  const enabledModuleIds = settings?.settings.enabledModuleIds as string[] | undefined;
  const visibleCards = [
    ...(enabledModuleIds ? MODULE_CARDS.filter((card) => enabledModuleIds.includes(card.id)) : MODULE_CARDS),
    ...PLATFORM_CARDS,
  ];

  const grouped = visibleCards.reduce<Record<string, ModuleCard[]>>(
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

  const EVENT_ICONS: Record<string, string> = {
    "pest-spray-log.withholding": "\u26A0",
    "sheep.drenching-withholding": "\u26A0",
    "crop-planning.harvest": "\uD83C\uDF3E",
    "crop-planning.planting": "\uD83C\uDF31",
    "pigs.weaning": "\uD83D\uDC37",
    "bees.inspection": "\uD83D\uDC1D",
  };

  const EVENT_SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
    "due-soon": { bg: "bg-red-50 border-red-200", text: "text-red-700" },
    upcoming: { bg: "bg-green-50 border-green-200", text: "text-green-700" },
  };

  return (
    <DashboardShell title={`Welcome to ${farmData?.name ?? farmName ?? "your farm"}`}>
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
            {upcomingEvents.map((event: ReminderItem) => {
              const style = EVENT_SEVERITY_STYLES[event.severity] ?? EVENT_SEVERITY_STYLES.upcoming;
              const icon = EVENT_ICONS[event.sourceId] ?? "📌";
              return (
                <Link
                  key={event.id}
                  to={event.path}
                  className={`rounded-lg border p-3 transition-colors hover:opacity-80 ${style.bg}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
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

      {/* Income vs Expense Chart */}
      {farmId && <IncomeExpenseChart farmId={farmId} />}

      {/* Setup Completeness Nudges */}
      {(() => {
        const emptyNudges = Object.entries(SETUP_NUDGES)
          .filter(([id]) => !enabledModuleIds || enabledModuleIds.includes(id))
          .filter(([id]) => {
            const count = recordCounts[id];
            return count === undefined || count === 0;
          });
        if (emptyNudges.length === 0) return null;
        return (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Setup Suggestions
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {emptyNudges.map(([id, nudge]) => (
                <Link
                  key={id}
                  to={nudge.path}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:opacity-80"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚙️</span>
                    <span className="text-xs font-semibold text-amber-700">{nudge.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-800">{nudge.description}</p>
                  <p className="mt-0.5 text-xs text-amber-600">Set up now →</p>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

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