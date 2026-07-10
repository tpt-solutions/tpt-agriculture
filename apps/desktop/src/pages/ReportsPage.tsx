// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFarm } from "../farm/FarmContext.js";
import { getDb } from "@tpt/core";
import {
  harvestBatches,
  dairyMilkRecords,
  poultryEggRecords,
  beeHoneyHarvests,
  ledgerEntries,
} from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { exportCsv } from "../utils/csv-export.js";

interface ProductionData {
  date: string;
  module: string;
  item: string;
  quantity: number;
  unit: string;
}

interface ReportFilters {
  fromDate: string;
  toDate: string;
  module: string;
}

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "harvest-tracking", label: "Harvest Tracking" },
  { value: "cattle-dairy", label: "Dairy Cattle" },
  { value: "poultry", label: "Poultry" },
  { value: "bees", label: "Bees" },
  { value: "financials", label: "Financials" },
];

export function ReportsPage() {
  const { farmId } = useFarm();
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [filters, setFilters] = useState<ReportFilters>({
    fromDate: thirtyDaysAgo,
    toDate: today,
    module: "all",
  });

  const { data: productionData = [] } = useQuery({
    queryKey: ["production-report", farmId, filters],
    queryFn: async (): Promise<ProductionData[]> => {
      if (!farmId) return [];
      const db = await getDb();
      const result: ProductionData[] = [];

      // Harvest data
      if (filters.module === "all" || filters.module === "harvest-tracking") {
        const harvests = await db
          .select({
            harvestDate: harvestBatches.harvestDate,
            cropVariety: harvestBatches.cropVariety,
            totalYieldKg: harvestBatches.totalYieldKg,
          })
          .from(harvestBatches)
          .where(eq(harvestBatches.farmId, farmId));

        for (const h of harvests) {
          if (h.harvestDate && h.totalYieldKg) {
            result.push({
              date: h.harvestDate.toISOString().split("T")[0],
              module: "harvest-tracking",
              item: h.cropVariety,
              quantity: h.totalYieldKg,
              unit: "kg",
            });
          }
        }
      }

      // Dairy milk records
      if (filters.module === "all" || filters.module === "cattle-dairy") {
        const milk = await db
          .select({
            date: dairyMilkRecords.date,
            liters: dairyMilkRecords.liters,
          })
          .from(dairyMilkRecords);

        for (const m of milk) {
          if (m.date && m.liters) {
            result.push({
              date: m.date.toISOString().split("T")[0],
              module: "cattle-dairy",
              item: "Milk",
              quantity: m.liters,
              unit: "L",
            });
          }
        }
      }

      // Poultry egg records
      if (filters.module === "all" || filters.module === "poultry") {
        const eggs = await db
          .select({
            date: poultryEggRecords.date,
            eggCount: poultryEggRecords.eggCount,
          })
          .from(poultryEggRecords);

        for (const e of eggs) {
          if (e.date && e.eggCount) {
            result.push({
              date: e.date.toISOString().split("T")[0],
              module: "poultry",
              item: "Eggs",
              quantity: e.eggCount,
              unit: "count",
            });
          }
        }
      }

      // Bee honey harvests
      if (filters.module === "all" || filters.module === "bees") {
        const honey = await db
          .select({
            date: beeHoneyHarvests.date,
            kg: beeHoneyHarvests.kg,
          })
          .from(beeHoneyHarvests);

        for (const h of honey) {
          if (h.date && h.kg) {
            result.push({
              date: h.date.toISOString().split("T")[0],
              module: "bees",
              item: "Honey",
              quantity: h.kg,
              unit: "kg",
            });
          }
        }
      }

      // Financial ledger entries
      if (filters.module === "all" || filters.module === "financials") {
        const entries = await db
          .select({
            date: ledgerEntries.date,
            amount: ledgerEntries.amount,
            type: ledgerEntries.type,
            category: ledgerEntries.category,
          })
          .from(ledgerEntries)
          .where(eq(ledgerEntries.farmId, farmId));

        for (const e of entries) {
          if (e.date && e.amount) {
            result.push({
              date: e.date.toISOString().split("T")[0],
              module: "financials",
              item: `${e.type} - ${e.category ?? "Uncategorized"}`,
              quantity: e.amount,
              unit: "NZD",
            });
          }
        }
      }

      return result.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!farmId,
  });

  const handleExportCsv = () => {
    const csvData = productionData.map((row) => ({
      date: row.date,
      module: row.module,
      item: row.item,
      quantity: String(row.quantity),
      unit: row.unit,
    }));
    exportCsv(
      "farm-production-report",
      [
        { key: "date", label: "Date" },
        { key: "module", label: "Module" },
        { key: "item", label: "Item" },
        { key: "quantity", label: "Quantity" },
        { key: "unit", label: "Unit" },
      ],
      csvData,
    );
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Farm Reports</h1>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Report Filters</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Module</label>
            <select
              value={filters.module}
              onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Production Report</h2>
        <button
          type="button"
          onClick={handleExportCsv}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Module</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Item</th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productionData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No production data found for the selected period
                </td>
              </tr>
            ) : (
              productionData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">{row.date}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{row.module}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{row.item}</td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                    {row.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">{row.unit}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}