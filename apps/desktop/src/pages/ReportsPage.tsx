// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell, Button, Input, Select } from "@tpt/ui";
import { toast } from "sonner";
import { getDb, MODULE_REGISTRY } from "@tpt/core";
import { ledgerEntries } from "@tpt/core/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { useFarm } from "../farm/FarmContext.js";
import { MODULE_ADAPTERS } from "../modules/registry.js";
import { rowsToCsv, downloadCsv } from "../utils/csv-export.js";
import { generateTablePdf, downloadPdf } from "../utils/pdf-export.js";
import { CONNECTORS } from "../accounting/xero-connector.js";
import type { LedgerEntry } from "../accounting/accounting-connector.js";

interface LedgerRow {
  id: string;
  type: string;
  date: Date;
  amount: number;
  category: string | null;
  moduleId: string | null;
  description: string | null;
}

function defaultFromDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function moduleName(moduleId: string | null): string {
  if (!moduleId) return "Unassigned";
  return MODULE_REGISTRY[moduleId]?.name ?? moduleId;
}

const REPORT_MODULE_IDS = Object.keys(MODULE_ADAPTERS).sort((a, b) =>
  (MODULE_REGISTRY[a]?.name ?? a).localeCompare(MODULE_REGISTRY[b]?.name ?? b)
);

export function ReportsPage() {
  const { farmId, farmName } = useFarm();
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(defaultToDate());
  const [exportModuleId, setExportModuleId] = useState(REPORT_MODULE_IDS[0] ?? "");
  const [exporting, setExporting] = useState(false);

  const { data: ledgerRows = [], isLoading } = useQuery({
    queryKey: ["reports-ledger", farmId, fromDate, toDate],
    queryFn: async (): Promise<LedgerRow[]> => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.farmId, farmId!),
            gte(ledgerEntries.date, new Date(fromDate)),
            lte(ledgerEntries.date, new Date(`${toDate}T23:59:59`))
          )
        );
      return rows as unknown as LedgerRow[];
    },
    enabled: !!farmId,
  });

  const summary = useMemo(() => {
    const income = ledgerRows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amount, 0);
    const expense = ledgerRows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amount, 0);

    const byModule = new Map<string, { income: number; expense: number }>();
    for (const row of ledgerRows) {
      const key = moduleName(row.moduleId);
      const entry = byModule.get(key) ?? { income: 0, expense: 0 };
      if (row.type === "INCOME") entry.income += row.amount;
      else entry.expense += row.amount;
      byModule.set(key, entry);
    }
    const moduleBreakdown = Array.from(byModule.entries())
      .map(([name, totals]) => ({ name, ...totals, profit: totals.income - totals.expense }))
      .sort((a, b) => b.profit - a.profit);

    return { income, expense, profit: income - expense, moduleBreakdown };
  }, [ledgerRows]);

  const ledgerColumns = [
    { key: "date", label: "Date" },
    { key: "type", label: "Type" },
    { key: "category", label: "Category" },
    { key: "moduleId", label: "Enterprise" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
  ];

  function ledgerExportRows() {
    return ledgerRows.map((r) => ({
      date: r.date instanceof Date ? r.date.toLocaleDateString() : String(r.date),
      type: r.type,
      category: r.category ?? "",
      moduleId: moduleName(r.moduleId),
      description: r.description ?? "",
      amount: r.amount.toFixed(2),
    }));
  }

  function handleExportLedgerCsv() {
    if (ledgerRows.length === 0) {
      toast.error("No ledger entries in the selected date range");
      return;
    }
    const csv = rowsToCsv(ledgerColumns, ledgerExportRows());
    downloadCsv(csv, `financial-summary-${fromDate}-to-${toDate}.csv`);
    toast.success("Financial summary CSV exported");
  }

  function handleExportLedgerPdf() {
    if (ledgerRows.length === 0) {
      toast.error("No ledger entries in the selected date range");
      return;
    }
    const columns = ledgerColumns.map((c) => c.label);
    const rows = ledgerExportRows().map((row) => ({ cells: ledgerColumns.map((c) => String(row[c.key as keyof typeof row])) }));
    const pdf = generateTablePdf(
      `Financial Summary — ${farmName}`,
      `${fromDate} to ${toDate} — Income $${summary.income.toFixed(2)} · Expense $${summary.expense.toFixed(2)} · Profit $${summary.profit.toFixed(2)}`,
      columns,
      rows
    );
    downloadPdf(pdf, `financial-summary-${fromDate}-to-${toDate}.pdf`);
    toast.success("Financial summary PDF exported");
  }

  async function handleExportModuleCsv() {
    if (!farmId || !exportModuleId) return;
    const adapter = MODULE_ADAPTERS[exportModuleId];
    if (!adapter) return;
    setExporting(true);
    try {
      const items = await adapter.list(farmId);
      if (items.length === 0) {
        toast.error(`No ${adapter.label.toLowerCase()} records to export`);
        return;
      }
      const csv = rowsToCsv(adapter.columns, items);
      downloadCsv(csv, `${exportModuleId}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`${adapter.label} CSV exported`);
    } finally {
      setExporting(false);
    }
  }

  const [selectedConnector, setSelectedConnector] = useState(CONNECTORS[0]?.id ?? "");

  function handleExportAccounting() {
    if (ledgerRows.length === 0) {
      toast.error("No ledger entries in the selected date range");
      return;
    }
    const connector = CONNECTORS.find((c) => c.id === selectedConnector);
    if (!connector) return;

    const blob = connector.exportLedger(farmName ?? "Farm", ledgerRows as LedgerEntry[], fromDate, toDate);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tpt-finance-${fromDate}-to-${toDate}.${connector.fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported for ${connector.name}`);
  }

  return (
    <DashboardShell title="Reports">
      <p className="mb-6 text-sm text-gray-500">
        Export financial and production data for your accountant, bank, or your own records.
      </p>

      <section className="mb-8 rounded-lg border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Financial Summary</h3>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={handleExportLedgerCsv} disabled={isLoading}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handleExportLedgerPdf} disabled={isLoading}>
            Export PDF
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-xs text-green-700">Income</p>
                <p className="text-lg font-semibold text-green-900">${summary.income.toFixed(2)}</p>
              </div>
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-xs text-red-700">Expense</p>
                <p className="text-lg font-semibold text-red-900">${summary.expense.toFixed(2)}</p>
              </div>
              <div className={`rounded-md p-3 ${summary.profit >= 0 ? "bg-blue-50" : "bg-amber-50"}`}>
                <p className={`text-xs ${summary.profit >= 0 ? "text-blue-700" : "text-amber-700"}`}>Net Profit</p>
                <p className={`text-lg font-semibold ${summary.profit >= 0 ? "text-blue-900" : "text-amber-900"}`}>
                  ${summary.profit.toFixed(2)}
                </p>
              </div>
            </div>

            {summary.moduleBreakdown.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-1.5 font-medium">Enterprise</th>
                    <th className="py-1.5 text-right font-medium">Income</th>
                    <th className="py-1.5 text-right font-medium">Expense</th>
                    <th className="py-1.5 text-right font-medium">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.moduleBreakdown.map((m) => (
                    <tr key={m.name}>
                      <td className="py-1.5 text-gray-700">{m.name}</td>
                      <td className="py-1.5 text-right text-gray-700">${m.income.toFixed(2)}</td>
                      <td className="py-1.5 text-right text-gray-700">${m.expense.toFixed(2)}</td>
                      <td className={`py-1.5 text-right font-medium ${m.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                        ${m.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Module Data Export</h3>
        <p className="mb-3 text-sm text-gray-500">Export the full record list of any module as CSV.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Module</label>
            <Select
              value={exportModuleId}
              onChange={(e) => setExportModuleId(e.target.value)}
              options={REPORT_MODULE_IDS.map((id) => ({ value: id, label: MODULE_REGISTRY[id]?.name ?? id }))}
            />
          </div>
          <Button variant="secondary" onClick={handleExportModuleCsv} disabled={exporting}>
            Export CSV
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Accounting Software Export</h3>
        <p className="mb-3 text-sm text-gray-500">
          Export your ledger entries in a format compatible with your accounting software.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Software</label>
            <Select
              value={selectedConnector}
              onChange={(e) => setSelectedConnector(e.target.value)}
              options={CONNECTORS.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <Button variant="secondary" onClick={handleExportAccounting} disabled={isLoading}>
            Export
          </Button>
        </div>
        {CONNECTORS.find((c) => c.id === selectedConnector) && (
          <p className="mt-2 text-xs text-gray-500">
            {CONNECTORS.find((c) => c.id === selectedConnector)?.description}
          </p>
        )}
      </section>
    </DashboardShell>
  );
}
