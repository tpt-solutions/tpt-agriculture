// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell, Input } from "@tpt/ui";
import { getDb } from "@tpt/core";
import {
  ledgerEntries,
  dairyMilkRecords,
  harvestBatches,
} from "@tpt/core/schema";
import { and, eq, gte, lte, asc } from "drizzle-orm";
import { useFarm } from "../farm/FarmContext.js";
import { BarChart, LineChart } from "../components/Charts.js";

interface MonthBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

function buildMonthBuckets(fromDate: string, toDate: string): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const label = cursor.toLocaleString(undefined, { month: "short", year: "2-digit" });
    buckets.push({ key, label, start: bucketStart, end: bucketEnd });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

function bucketForDate(date: Date, buckets: MonthBucket[]): MonthBucket | undefined {
  return buckets.find((b) => date >= b.start && date <= b.end);
}

function defaultFromDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AnalyticsPage() {
  const { farmId } = useFarm();
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const buckets = useMemo(() => buildMonthBuckets(fromDate, toDate), [fromDate, toDate]);

  // ─── Financials by month ──────────────────────────────────────────────
  const { data: ledgerRows = [] } = useQuery({
    queryKey: ["analytics-ledger", farmId, fromDate, toDate],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      return db
        .select()
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.farmId, farmId),
            gte(ledgerEntries.date, new Date(fromDate)),
            lte(ledgerEntries.date, new Date(`${toDate}T23:59:59`)),
          )
        ) as unknown as { type: string; date: Date; amount: number; moduleId: string | null }[];
    },
    enabled: !!farmId,
  });

  const financialByMonth = useMemo(() => {
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    for (const row of ledgerRows) {
      const bucket = bucketForDate(row.date, buckets);
      if (!bucket) continue;
      if (row.type === "INCOME") {
        incomeMap.set(bucket.key, (incomeMap.get(bucket.key) ?? 0) + row.amount);
      } else {
        expenseMap.set(bucket.key, (expenseMap.get(bucket.key) ?? 0) + row.amount);
      }
    }
    return buckets.map((b) => ({
      label: b.label,
      income: incomeMap.get(b.key) ?? 0,
      expense: expenseMap.get(b.key) ?? 0,
      profit: (incomeMap.get(b.key) ?? 0) - (expenseMap.get(b.key) ?? 0),
    }));
  }, [ledgerRows, buckets]);

  // ─── Dairy milk production by month ───────────────────────────────────
  const { data: milkRows = [] } = useQuery({
    queryKey: ["analytics-milk", farmId, fromDate, toDate],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      // Join with dairy_cows to get farmId
      const rows = await db
        .select({ date: dairyMilkRecords.date, liters: dairyMilkRecords.liters })
        .from(dairyMilkRecords)
        .innerJoin(
          (await import("@tpt/core/schema")).dairyCows,
          eq(dairyMilkRecords.cowId, (await import("@tpt/core/schema")).dairyCows.id),
        )
        .where(
          and(
            eq((await import("@tpt/core/schema")).dairyCows.farmId, farmId),
            gte(dairyMilkRecords.date, new Date(fromDate)),
            lte(dairyMilkRecords.date, new Date(`${toDate}T23:59:59`)),
          )
        )
        .orderBy(asc(dairyMilkRecords.date)) as unknown as { date: Date; liters: number }[];
      return rows;
    },
    enabled: !!farmId,
  });

  const milkByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of milkRows) {
      const bucket = bucketForDate(row.date, buckets);
      if (!bucket) continue;
      map.set(bucket.key, (map.get(bucket.key) ?? 0) + (row.liters ?? 0));
    }
    return buckets.map((b) => ({ label: b.label, value: map.get(b.key) ?? 0 }));
  }, [milkRows, buckets]);

  // ─── Harvest yield by month ──────────────────────────────────────────
  const { data: harvestRows = [] } = useQuery({
    queryKey: ["analytics-harvest", farmId, fromDate, toDate],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      return db
        .select({ date: harvestBatches.harvestDate, yieldKg: harvestBatches.totalYieldKg })
        .from(harvestBatches)
        .where(
          and(
            eq(harvestBatches.farmId, farmId),
            gte(harvestBatches.harvestDate, new Date(fromDate)),
            lte(harvestBatches.harvestDate, new Date(`${toDate}T23:59:59`)),
          )
        ) as unknown as { date: Date; yieldKg: number }[];
    },
    enabled: !!farmId,
  });

  const harvestByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of harvestRows) {
      const bucket = bucketForDate(row.date, buckets);
      if (!bucket) continue;
      map.set(bucket.key, (map.get(bucket.key) ?? 0) + (row.yieldKg ?? 0));
    }
    return buckets.map((b) => ({ label: b.label, value: map.get(b.key) ?? 0 }));
  }, [harvestRows, buckets]);

  // ─── Sheep lambing % ─────────────────────────────────────────────────
  const { data: lambingRows = [] } = useQuery({
    queryKey: ["analytics-lambing", farmId, fromDate, toDate],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      const schema = await import("@tpt/core/schema");
      return db
        .select({ date: schema.sheepLambingRecords.date, lambingPct: schema.sheepLambingRecords.lambingPct })
        .from(schema.sheepLambingRecords)
        .innerJoin(schema.sheepFlocks, eq(schema.sheepLambingRecords.flockId, schema.sheepFlocks.id))
        .where(
          and(
            eq(schema.sheepFlocks.farmId, farmId),
            gte(schema.sheepLambingRecords.date, new Date(fromDate)),
            lte(schema.sheepLambingRecords.date, new Date(`${toDate}T23:59:59`)),
          )
        ) as unknown as { date: Date; lambingPct: number | null }[];
    },
    enabled: !!farmId,
  });

  const lambingByMonth = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const row of lambingRows) {
      const bucket = bucketForDate(row.date, buckets);
      if (!bucket || row.lambingPct == null) continue;
      const entry = map.get(bucket.key) ?? { sum: 0, count: 0 };
      entry.sum += row.lambingPct;
      entry.count += 1;
      map.set(bucket.key, entry);
    }
    return buckets.map((b) => {
      const entry = map.get(b.key);
      return { label: b.label, value: entry ? Math.round(entry.sum / entry.count) : 0 };
    });
  }, [lambingRows, buckets]);

  // ─── Egg production by month ─────────────────────────────────────────
  const { data: eggRows = [] } = useQuery({
    queryKey: ["analytics-eggs", farmId, fromDate, toDate],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      const schema = await import("@tpt/core/schema");
      return db
        .select({ date: schema.poultryEggRecords.date, eggCount: schema.poultryEggRecords.eggCount })
        .from(schema.poultryEggRecords)
        .innerJoin(schema.poultryFlocks, eq(schema.poultryEggRecords.flockId, schema.poultryFlocks.id))
        .where(
          and(
            eq(schema.poultryFlocks.farmId, farmId),
            gte(schema.poultryEggRecords.date, new Date(fromDate)),
            lte(schema.poultryEggRecords.date, new Date(`${toDate}T23:59:59`)),
          )
        ) as unknown as { date: Date; eggCount: number }[];
    },
    enabled: !!farmId,
  });

  const eggsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of eggRows) {
      const bucket = bucketForDate(row.date, buckets);
      if (!bucket) continue;
      map.set(bucket.key, (map.get(bucket.key) ?? 0) + (row.eggCount ?? 0));
    }
    return buckets.map((b) => ({ label: b.label, value: map.get(b.key) ?? 0 }));
  }, [eggRows, buckets]);

  // ─── Honey harvest by month ──────────────────────────────────────────
  const { data: honeyRows = [] } = useQuery({
    queryKey: ["analytics-honey", farmId, fromDate, toDate],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      const schema = await import("@tpt/core/schema");
      return db
        .select({ date: schema.beeHoneyHarvests.date, kg: schema.beeHoneyHarvests.kg })
        .from(schema.beeHoneyHarvests)
        .innerJoin(schema.beeHives, eq(schema.beeHoneyHarvests.hiveId, schema.beeHives.id))
        .where(
          and(
            eq(schema.beeHives.farmId, farmId),
            gte(schema.beeHoneyHarvests.date, new Date(fromDate)),
            lte(schema.beeHoneyHarvests.date, new Date(`${toDate}T23:59:59`)),
          )
        ) as unknown as { date: Date; kg: number }[];
    },
    enabled: !!farmId,
  });

  const honeyByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of honeyRows) {
      const bucket = bucketForDate(row.date, buckets);
      if (!bucket) continue;
      map.set(bucket.key, (map.get(bucket.key) ?? 0) + (row.kg ?? 0));
    }
    return buckets.map((b) => ({ label: b.label, value: map.get(b.key) ?? 0 }));
  }, [honeyRows, buckets]);

  // ─── KPI summaries ──────────────────────────────────────────────────
  const totalIncome = ledgerRows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amount, 0);
  const totalExpense = ledgerRows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amount, 0);
  const totalMilk = milkByMonth.reduce((s, m) => s + m.value, 0);
  const totalHarvest = harvestByMonth.reduce((s, m) => s + m.value, 0);
  const totalEggs = eggsByMonth.reduce((s, m) => s + m.value, 0);
  const totalHoney = honeyByMonth.reduce((s, m) => s + m.value, 0);

  const kpis = [
    { label: "Net Profit", value: `$${(totalIncome - totalExpense).toFixed(2)}`, color: totalIncome - totalExpense >= 0 ? "text-green-700" : "text-red-700" },
    { label: "Total Income", value: `$${totalIncome.toFixed(2)}`, color: "text-green-700" },
    { label: "Total Expense", value: `$${totalExpense.toFixed(2)}`, color: "text-red-700" },
    ...(totalMilk > 0 ? [{ label: "Total Milk", value: `${totalMilk.toLocaleString()} L`, color: "text-blue-700" }] : []),
    ...(totalHarvest > 0 ? [{ label: "Total Harvest", value: `${totalHarvest.toLocaleString()} kg`, color: "text-green-700" }] : []),
    ...(totalEggs > 0 ? [{ label: "Total Eggs", value: totalEggs.toLocaleString(), color: "text-amber-700" }] : []),
    ...(totalHoney > 0 ? [{ label: "Total Honey", value: `${totalHoney.toLocaleString()} kg`, color: "text-amber-700" }] : []),
  ];

  return (
    <DashboardShell title="Analytics & KPIs">
      <p className="mb-6 text-sm text-gray-500">
        Visualise production trends and key performance indicators over time.
      </p>

      {/* Date Range */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className={`text-lg font-semibold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {financialByMonth.some((m) => m.income > 0 || m.expense > 0) && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Income vs Expense</h3>
            <div className="flex gap-4 mb-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Income</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Expense</span>
            </div>
            <BarChart
              data={financialByMonth.map((m) => ({ label: m.label, value: m.income }))}
              barColor="#16a34a"
              formatValue={(v) => `$${v.toLocaleString()}`}
            />
            <div className="mt-2">
              <BarChart
                data={financialByMonth.map((m) => ({ label: m.label, value: m.expense }))}
                barColor="#f87171"
                formatValue={(v) => `$${v.toLocaleString()}`}
              />
            </div>
          </div>
        )}

        {milkByMonth.some((m) => m.value > 0) && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <LineChart
              data={milkByMonth}
              title="Milk Production (L)"
              lineColor="#3b82f6"
            />
          </div>
        )}

        {harvestByMonth.some((m) => m.value > 0) && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <BarChart
              data={harvestByMonth}
              title="Harvest Yield (kg)"
              barColor="#22c55e"
              formatValue={(v) => v.toLocaleString()}
            />
          </div>
        )}

        {lambingByMonth.some((m) => m.value > 0) && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <LineChart
              data={lambingByMonth}
              title="Lambing %"
              lineColor="#f59e0b"
            />
          </div>
        )}

        {eggsByMonth.some((m) => m.value > 0) && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <BarChart
              data={eggsByMonth}
              title="Egg Production"
              barColor="#f59e0b"
              formatValue={(v) => v.toLocaleString()}
            />
          </div>
        )}

        {honeyByMonth.some((m) => m.value > 0) && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <BarChart
              data={honeyByMonth}
              title="Honey Harvest (kg)"
              barColor="#d97706"
              formatValue={(v) => v.toLocaleString()}
            />
          </div>
        )}
      </div>

      {!financialByMonth.some((m) => m.income > 0 || m.expense > 0) &&
        !milkByMonth.some((m) => m.value > 0) &&
        !harvestByMonth.some((m) => m.value > 0) &&
        !lambingByMonth.some((m) => m.value > 0) &&
        !eggsByMonth.some((m) => m.value > 0) &&
        !honeyByMonth.some((m) => m.value > 0) && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">
            No data in the selected date range. Start logging production records to see trends here.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
