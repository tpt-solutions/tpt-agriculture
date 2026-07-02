// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { getDb } from "@tpt/core";
import { soilTests, ledgerEntries, equipmentAssets, inventoryItems } from "@tpt/core/schema";
import { eq, desc } from "drizzle-orm";
import { useFarm } from "../farm/FarmContext.js";

interface Advisory {
  id: string;
  priority: "high" | "medium" | "low";
  icon: string;
  title: string;
  detail: string;
}

const PRIORITY_STYLES = {
  high: "border-red-200 bg-red-50 text-red-900",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-blue-200 bg-blue-50 text-blue-900",
};

const PRIORITY_LABELS = {
  high: "Action Required",
  medium: "Review Soon",
  low: "Informational",
};

async function buildAdvisories(farmId: string): Promise<Advisory[]> {
  const db = await getDb();
  const advisories: Advisory[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // ── Soil health checks ────────────────────────────────────────────────────
  const latestSoilTests = await db.select().from(soilTests)
    .where(eq(soilTests.farmId, farmId))
    .orderBy(desc(soilTests.testDate))
    .limit(10) as unknown as Array<{ testDate: Date; pH: number | null; nitrogenKgHa: number | null; organicMatterPct: number | null; fieldName: string | null }>;

  if (latestSoilTests.length === 0) {
    advisories.push({
      id: "no-soil-tests",
      priority: "medium",
      icon: "🧪",
      title: "No soil test records",
      detail: "Add soil test results in Soil & Water to get nutrient deficiency alerts and targeted fertiliser recommendations.",
    });
  } else {
    for (const test of latestSoilTests.slice(0, 5)) {
      const field = test.fieldName ?? "a field";
      if (test.pH != null && test.pH < 5.5) {
        advisories.push({ id: `low-ph-${field}`, priority: "high", icon: "⚠️", title: `Low soil pH on ${field}`, detail: `pH ${test.pH.toFixed(1)} is below 5.5 — consider lime application to raise pH before next crop.` });
      }
      if (test.organicMatterPct != null && test.organicMatterPct < 2) {
        advisories.push({ id: `low-om-${field}`, priority: "medium", icon: "🌱", title: `Low organic matter on ${field}`, detail: `Organic matter at ${test.organicMatterPct.toFixed(1)}% — consider cover crops or compost additions to improve soil structure.` });
      }
      if (test.nitrogenKgHa != null && test.nitrogenKgHa < 50) {
        advisories.push({ id: `low-n-${field}`, priority: "medium", icon: "💧", title: `Low nitrogen on ${field}`, detail: `Nitrogen at ${test.nitrogenKgHa.toFixed(0)} kg/ha — plan nitrogen application before high-demand crops.` });
      }
    }
  }

  // ── Financial checks ──────────────────────────────────────────────────────
  const recentLedger = await db.select().from(ledgerEntries)
    .where(eq(ledgerEntries.farmId, farmId))
    .orderBy(desc(ledgerEntries.date))
    .limit(100) as unknown as Array<{ type: string; amount: number; date: Date }>;

  if (recentLedger.length === 0) {
    advisories.push({
      id: "no-financials",
      priority: "low",
      icon: "💰",
      title: "No financial records yet",
      detail: "Start recording income and expenses in Financials to unlock cash-flow trend analysis and ROI tracking.",
    });
  } else {
    const recent30 = recentLedger.filter((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      return d >= thirtyDaysAgo;
    });
    const income = recent30.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
    const expense = recent30.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);
    if (expense > income && income > 0) {
      advisories.push({
        id: "negative-cashflow",
        priority: "high",
        icon: "📉",
        title: "Negative cash flow last 30 days",
        detail: `Expenses ($${expense.toFixed(0)}) exceeded income ($${income.toFixed(0)}) in the last 30 days. Review your expense categories in Financials.`,
      });
    }
  }

  // ── Equipment service due ─────────────────────────────────────────────────
  const equipment = await db.select().from(equipmentAssets)
    .where(eq(equipmentAssets.farmId, farmId))
    .limit(50) as unknown as Array<{ name: string; nextServiceDate: Date | null; wofExpiry: Date | null; cofExpiry: Date | null }>;

  for (const asset of equipment) {
    const check = (label: string, date: Date | null) => {
      if (!date) return;
      const d = date instanceof Date ? date : new Date(date);
      if (d < now) {
        advisories.push({ id: `overdue-${label}-${asset.name}`, priority: "high", icon: "🔧", title: `${asset.name} — ${label} overdue`, detail: `Due ${d.toLocaleDateString()} — update the record in Equipment once serviced.` });
      } else if (d < thirtyDaysAhead) {
        advisories.push({ id: `due-soon-${label}-${asset.name}`, priority: "medium", icon: "🔔", title: `${asset.name} — ${label} due soon`, detail: `Due ${d.toLocaleDateString()} — schedule before the deadline.` });
      }
    };
    check("service", asset.nextServiceDate);
    check("WoF", asset.wofExpiry);
    check("CoF", asset.cofExpiry);
  }

  // ── Low inventory alerts ──────────────────────────────────────────────────
  const inventory = await db.select().from(inventoryItems)
    .where(eq(inventoryItems.farmId, farmId))
    .limit(100) as unknown as Array<{ itemName: string; currentStock: number; reorderLevel: number | null; unit: string | null }>;

  for (const item of inventory) {
    if (item.reorderLevel != null && item.currentStock <= item.reorderLevel) {
      advisories.push({
        id: `low-stock-${item.itemName}`,
        priority: item.currentStock <= 0 ? "high" : "medium",
        icon: "📦",
        title: `Low stock: ${item.itemName}`,
        detail: `${item.currentStock} ${item.unit ?? "units"} remaining (reorder level: ${item.reorderLevel}). Update Inventory when restocked.`,
      });
    }
  }

  if (advisories.length === 0) {
    advisories.push({
      id: "all-clear",
      priority: "low",
      icon: "✅",
      title: "No issues found",
      detail: "All checks passed. Keep recording data across your modules for better recommendations over time.",
    });
  }

  // Sort: high → medium → low
  const order = { high: 0, medium: 1, low: 2 };
  return advisories.sort((a, b) => order[a.priority] - order[b.priority]);
}

export function DecisionSupportPage() {
  const { farmId } = useFarm();

  const { data: advisories, isLoading } = useQuery({
    queryKey: ["decision-support", farmId],
    queryFn: () => buildAdvisories(farmId!),
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <DashboardShell title="Decision Support">
      <p className="mb-6 text-sm text-gray-500">
        Rules-based advisory combining soil test results, financial data, equipment service records, and inventory levels. Add more data across modules for better recommendations.
      </p>

      {isLoading && <p className="text-gray-500">Analysing farm data…</p>}

      <div className="space-y-3">
        {advisories?.map((a) => (
          <div key={a.id} className={`flex gap-3 rounded-lg border p-4 ${PRIORITY_STYLES[a.priority]}`}>
            <span className="text-2xl leading-none">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium">{a.title}</p>
                <span className={`text-xs rounded px-1.5 py-0.5 font-medium ${
                  a.priority === "high" ? "bg-red-200 text-red-800" :
                  a.priority === "medium" ? "bg-amber-200 text-amber-800" :
                  "bg-blue-200 text-blue-800"
                }`}>
                  {PRIORITY_LABELS[a.priority]}
                </span>
              </div>
              <p className="text-sm opacity-80">{a.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
