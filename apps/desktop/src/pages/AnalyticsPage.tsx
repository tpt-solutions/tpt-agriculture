// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery } from "@tanstack/react-query";
import { useFarm } from "../farm/FarmContext.js";
import { getDb } from "@tpt/core";
import {
  harvestBatches,
  dairyMilkRecords,
  fields,
  ledgerEntries,
} from "@tpt/core/schema";
import { eq } from "drizzle-orm";

interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface YieldBySeason {
  season: string;
  totalYield: number;
  area: number;
  yieldPerHa: number;
}

export function AnalyticsPage() {
  const { farmId } = useFarm();

  const { data: harvestTrend = [] } = useQuery({
    queryKey: ["analytics-harvest-trend", farmId],
    queryFn: async (): Promise<TimeSeriesPoint[]> => {
      if (!farmId) return [];
      const db = await getDb();
      const harvests = await db
        .select({
          harvestDate: harvestBatches.harvestDate,
          totalYieldKg: harvestBatches.totalYieldKg,
        })
        .from(harvestBatches)
        .where(eq(harvestBatches.farmId, farmId));

      const monthlyData: Record<string, number> = {};
      for (const h of harvests) {
        if (h.harvestDate && h.totalYieldKg) {
          const month = h.harvestDate.toISOString().slice(0, 7); // YYYY-MM
          monthlyData[month] = (monthlyData[month] ?? 0) + h.totalYieldKg;
        }
      }

      return Object.entries(monthlyData)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!farmId,
  });

  const { data: milkTrend = [] } = useQuery({
    queryKey: ["analytics-milk-trend", farmId],
    queryFn: async (): Promise<TimeSeriesPoint[]> => {
      if (!farmId) return [];
      const db = await getDb();
      const milk = await db
        .select({
          date: dairyMilkRecords.date,
          liters: dairyMilkRecords.liters,
        })
        .from(dairyMilkRecords);

      const monthlyData: Record<string, number> = {};
      for (const m of milk) {
        if (m.date && m.liters) {
          const month = m.date.toISOString().slice(0, 7);
          monthlyData[month] = (monthlyData[month] ?? 0) + m.liters;
        }
      }

      return Object.entries(monthlyData)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!farmId,
  });

  const { data: fieldAreas = [] } = useQuery({
    queryKey: ["analytics-field-areas", farmId],
    queryFn: async (): Promise<YieldBySeason[]> => {
      if (!farmId) return [];
      const db = await getDb();
      const flds = await db
        .select({
          areaHa: fields.areaHa,
        })
        .from(fields)
        .where(eq(fields.farmId, farmId));

      const totalArea = flds.reduce((sum, f) => sum + (f.areaHa ?? 0), 0);

      // Get harvest data by season (simplified: by year)
      const harvests = await db
        .select({
          harvestDate: harvestBatches.harvestDate,
          totalYieldKg: harvestBatches.totalYieldKg,
        })
        .from(harvestBatches)
        .where(eq(harvestBatches.farmId, farmId));

      const yearlyData: Record<string, { yield: number; count: number }> = {};
      for (const h of harvests) {
        if (h.harvestDate && h.totalYieldKg) {
          const year = String(h.harvestDate.getFullYear());
          yearlyData[year] = yearlyData[year] ?? { yield: 0, count: 0 };
          yearlyData[year].yield += h.totalYieldKg;
          yearlyData[year].count += 1;
        }
      }

      return Object.entries(yearlyData)
        .map(([season, data]) => ({
          season,
          totalYield: data.yield,
          area: totalArea,
          yieldPerHa: totalArea > 0 ? data.yield / totalArea : 0,
        }))
        .sort((a, b) => a.season.localeCompare(b.season));
    },
    enabled: !!farmId,
  });

  const { data: incomeExpense = [] } = useQuery({
    queryKey: ["analytics-income-expense", farmId],
    queryFn: async (): Promise<TimeSeriesPoint[]> => {
      if (!farmId) return [];
      const db = await getDb();
      const entries = await db
        .select({
          date: ledgerEntries.date,
          amount: ledgerEntries.amount,
          type: ledgerEntries.type,
        })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.farmId, farmId));

      const monthlyData: Record<string, { income: number; expense: number }> = {};
      for (const e of entries) {
        if (e.date && e.amount) {
          const month = e.date.toISOString().slice(0, 7);
          monthlyData[month] = monthlyData[month] ?? { income: 0, expense: 0 };
          if (e.type === "INCOME") {
            monthlyData[month].income += e.amount;
          } else {
            monthlyData[month].expense += e.amount;
          }
        }
      }

      return Object.entries(monthlyData)
        .map(([date, data]) => ({
          date,
          value: data.income - data.expense,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!farmId,
  });

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Analytics & KPIs</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Harvest Production Trend */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Harvest Production (kg/month)</h2>
          <div className="h-64">
            {harvestTrend.length === 0 ? (
              <p className="text-sm text-gray-500">No harvest data available</p>
            ) : (
              <SimpleBarChart data={harvestTrend} color="bg-green-500" />
            )}
          </div>
        </div>

        {/* Milk Production Trend */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Milk Production (L/month)</h2>
          <div className="h-64">
            {milkTrend.length === 0 ? (
              <p className="text-sm text-gray-500">No milk data available</p>
            ) : (
              <SimpleBarChart data={milkTrend} color="bg-blue-500" />
            )}
          </div>
        </div>

        {/* Yield per Hectare by Year */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Yield per Hectare (kg/ha)</h2>
          <div className="h-64">
            {fieldAreas.length === 0 ? (
              <p className="text-sm text-gray-500">No field data available</p>
            ) : (
              <SimpleBarChart
                data={fieldAreas.map((f) => ({ date: f.season, value: f.yieldPerHa }))}
                color="bg-amber-500"
              />
            )}
          </div>
        </div>

        {/* Income/Expense Trend */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Net Income (NZD/month)</h2>
          <div className="h-64">
            {incomeExpense.length === 0 ? (
              <p className="text-sm text-gray-500">No financial data available</p>
            ) : (
              <SimpleBarChart data={incomeExpense} color="bg-purple-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple bar chart component (no external chart library)
function SimpleBarChart({ data, color }: { data: TimeSeriesPoint[]; color: string }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barHeight = 120;

  return (
    <div className="flex h-full items-end justify-around gap-1 border-b border-gray-200 pb-2">
      {data.map((d) => (
        <div key={d.date} className="flex flex-col items-center">
          <div
            className={`w-8 ${color} rounded-t`}
            style={{ height: `${(d.value / maxValue) * barHeight}px` }}
            title={`${d.date}: ${d.value.toLocaleString()}`}
          />
          <span className="mt-1 text-xs text-gray-500" style={{ fontSize: "10px" }}>
            {d.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}