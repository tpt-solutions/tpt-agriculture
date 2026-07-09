// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { Select } from "@tpt/ui";
import { toast } from "sonner";
import { useFarm } from "../farm/FarmContext.js";
import { useCountryProfile } from "../context/FarmSettingsContext.js";
import { MODULE_REGISTRY, getDb } from "@tpt/core";
import { farms, sprayEvents, chemicals } from "@tpt/core/schema";
import { eq, and, gt, asc } from "drizzle-orm";
import { useModuleList, useModuleCreate, useModuleUpdate, useModuleDelete, useModuleBulkCreate, getModuleAdapter } from "../modules/use-module-query.js";
import { MODULE_TAB_GROUPS } from "../modules/registry.js";
import { generateChemicalRegisterPdf, downloadPdf } from "../utils/pdf-export.js";
import { exportCsv } from "../utils/csv-export.js";
import { CsvImportDialog } from "../components/CsvImportDialog.js";
import { PlantingCalendar } from "../components/PlantingCalendar.js";
import { SelectWithCustom } from "../components/SelectWithCustom.js";
import { ForeignKeySelect } from "../components/ForeignKeySelect.js";
import { PhotoAttachments } from "../components/PhotoAttachments.js";

type SortDir = "asc" | "desc";

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { farmId } = useFarm();
  const meta = moduleId ? MODULE_REGISTRY[moduleId] : undefined;
  
  // Get locale and chemical reg label from country profile
  const countryProfile = useCountryProfile();
  const locale = countryProfile?.locale;
  const chemicalRegLabel = countryProfile?.regulatory?.chemicalRegNumber;

  // Modules with sub-tables (e.g. Sheep → Flocks/Lambing/Drenching/Shearing) show a
  // tab bar; the active tab picks which adapter/table is displayed on this page.
  const tabs = (moduleId && MODULE_TAB_GROUPS[moduleId]) || (moduleId ? [{ id: moduleId, label: meta?.name ?? moduleId }] : []);
  const [activeTabId, setActiveTabId] = useState<string>(moduleId ?? "");
  const activeModuleId = tabs.some((t) => t.id === activeTabId) ? activeTabId : (moduleId ?? "");

  // Use locale-aware adapter
  const adapter = activeModuleId ? getModuleAdapter(activeModuleId, locale, chemicalRegLabel) : undefined;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<"table" | "calendar" | "roi">("table");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [photoRecordId, setPhotoRecordId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    setActiveTabId(moduleId ?? "");
    setShowForm(false);
    setEditingId(null);
    setViewMode("table");
    setBulkMode(false);
    setSelectedIds(new Set());
    setCurrentPage(1);
  }, [moduleId]);

  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useModuleList(activeModuleId, farmId ?? undefined);
  const createMutation = useModuleCreate(activeModuleId, farmId ?? "");
  const updateMutation = useModuleUpdate(activeModuleId, farmId ?? "");
  const deleteMutation = useModuleDelete(activeModuleId, farmId ?? "");
  const bulkCreateMutation = useModuleBulkCreate(activeModuleId, farmId ?? "");

  // Fetch farm name for PDF export
  const { data: farmData } = useQuery({
    queryKey: ["farm", farmId],
    queryFn: async () => {
      if (!farmId) return null;
      const db = await getDb();
      const [row] = await db.select().from(farms).where(eq(farms.id, farmId)).limit(1);
      return row;
    },
    enabled: !!farmId,
  });

  // Active withholding period alerts (pest-spray-log only)
  const { data: withholdingAlerts = [] } = useQuery({
    queryKey: ["withholding-alerts", farmId],
    queryFn: async () => {
      if (!farmId || moduleId !== "pest-spray-log") return [];
      const db = await getDb();
      const now = new Date();
      const active = await db
        .select({
          id: sprayEvents.id,
          applicationDate: sprayEvents.applicationDate,
          withholdingEndDate: sprayEvents.withholdingEndDate,
          chemicalId: sprayEvents.chemicalId,
        })
        .from(sprayEvents)
        .where(and(eq(sprayEvents.farmId, farmId), gt(sprayEvents.withholdingEndDate, now)))
        .orderBy(asc(sprayEvents.withholdingEndDate));

      const alerts: { chemicalName: string; endDate: Date; daysRemaining: number }[] = [];
      for (const sw of active) {
        if (!sw.withholdingEndDate) continue;
        let chemicalName = "Unknown";
        if (sw.chemicalId) {
          const [chem] = await db.select({ name: chemicals.name }).from(chemicals).where(eq(chemicals.id, sw.chemicalId)).limit(1);
          if (chem) chemicalName = chem.name;
        }
        const daysRemaining = Math.ceil((sw.withholdingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({ chemicalName, endDate: sw.withholdingEndDate, daysRemaining });
      }
      return alerts;
    },
    enabled: !!farmId && moduleId === "pest-spray-log",
  });

  // PDF export handler (pest-spray-log only)
  function handleExportPdf() {
    const mod = adapter;
    if (!mod) return;
    const pdfColumns = mod.columns.map((c) => c.label);
    const pdfRows = items.map((item) => ({
      cells: mod.columns.map((col) => formatValue(item[col.key], col)),
    }));
    const pdfData = generateChemicalRegisterPdf(farmData?.name ?? "Farm", pdfColumns, pdfRows);
    downloadPdf(pdfData, `chemical-register-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Chemical register PDF exported");
  }

  if (!meta || !adapter) {
    return (
      <DashboardShell title="Module Not Found">
        <p className="text-sm text-gray-500">
          The module "{moduleId}" does not exist.
        </p>
      </DashboardShell>
    );
  }

  const mod = adapter;

  function openCreateForm() {
    setEditingId(null);
    // Prefill date fields with today so quick-logging events (drenching, milking,
    // spraying...) doesn't require re-picking the date every time.
    const today = new Date().toISOString().slice(0, 10);
    const defaults: Record<string, string> = {};
    for (const field of mod.formFields) {
      if (field.type === "date") defaults[field.key] = today;
    }
    setFormValues(defaults);
    setShowForm(true);
  }

  function openEditForm(item: Record<string, unknown>) {
    setEditingId(String(item.id));
    const values: Record<string, string> = {};
    for (const field of mod.formFields) {
      const v = item[field.key];
      if (field.type === "date" && v) {
        if (v instanceof Date) values[field.key] = v.toISOString().slice(0, 10);
        else if (typeof v === "number") values[field.key] = new Date(v).toISOString().slice(0, 10);
        else values[field.key] = String(v);
      } else if (v != null) {
        values[field.key] = String(v);
      } else {
        values[field.key] = "";
      }
    }
    setFormValues(values);
    setShowForm(true);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    let parentIdField: string | undefined;
    for (const field of mod.formFields) {
      if (field.foreignKey) {
        parentIdField = field.key;
        if (bulkMode) continue; // In bulk mode, parent IDs come from selected rows
      }
      const raw = formValues[field.key];
      if (raw === "" || raw === undefined) {
        if (!field.required) continue;
        data[field.key] = null;
      } else if (field.type === "number") {
        data[field.key] = Number(raw);
      } else if (field.type === "date") {
        data[field.key] = new Date(raw);
      } else if (field.type === "select" && field.boolean) {
        data[field.key] = raw === "true";
      } else {
        data[field.key] = raw;
      }
    }

    if (bulkMode && parentIdField) {
      bulkCreateMutation.mutate(
        { parentIds: Array.from(selectedIds), parentIdField, data },
        {
          onSuccess: () => {
            setShowForm(false);
            setSelectedIds(new Set());
            setBulkMode(false);
            toast.success(`${mod.label.replace(/s$/, "")} created for ${selectedIds.size} records`);
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Failed to create records");
          },
        }
      );
    } else if (editingId) {
      updateMutation.mutate(
        { id: editingId, data },
        {
          onSuccess: () => {
            setShowForm(false);
            setEditingId(null);
            toast.success(`${mod.label.replace(/s$/, "")} updated successfully`);
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Failed to update record");
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setShowForm(false);
          toast.success(`${mod.label.replace(/s$/, "")} created successfully`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create record");
        },
      });
    }
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        toast.success(`${mod.label.replace(/s$/, "")} deleted`);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete record");
      },
    });
  }

  function formatValue(value: unknown, col: { key: string; type?: string; format?: (v: unknown) => string }): string {
    if (value == null) return "\u2014";
    if (col.format) return col.format(value);
    if (col.type === "date") {
      if (value instanceof Date) return value.toLocaleDateString();
      if (typeof value === "number") return new Date(value).toLocaleDateString();
    }
    if (col.type === "boolean") return value ? "Yes" : "No";
    return String(value);
  }

  function handleSort(colKey: string) {
    if (sortKey === colKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(colKey);
      setSortDir("asc");
    }
  }

  const roiRows = useMemo(() => {
    if (moduleId !== "financials") return [];
    const totals: Record<string, { income: number; expense: number }> = {};
    for (const item of items) {
      const key = item.moduleId ? String(item.moduleId) : "unassigned";
      const bucket = (totals[key] ??= { income: 0, expense: 0 });
      const amount = Number(item.amount) || 0;
      if (item.type === "INCOME") bucket.income += amount;
      else if (item.type === "EXPENSE") bucket.expense += amount;
    }
    return Object.entries(totals)
      .map(([key, { income, expense }]) => ({
        key,
        label: key === "unassigned" ? "Unassigned" : (MODULE_REGISTRY[key]?.name ?? key),
        income,
        expense,
        profit: income - expense,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [items, moduleId]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    let result = items;

    // Client-side search/filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) =>
        mod.columns.some((col) => {
          const val = item[col.key];
          if (val == null) return false;
          return formatValue(val, col).toLowerCase().includes(q);
        })
      );
    }

    // Client-side sort
    if (sortKey) {
      const col = mod.columns.find((c) => c.key === sortKey);
      result = [...result].sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;

        let cmp = 0;
        if (col?.type === "number") {
          cmp = Number(va) - Number(vb);
        } else if (col?.type === "date") {
          const da = va instanceof Date ? va.getTime() : typeof va === "number" ? va : 0;
          const db = vb instanceof Date ? vb.getTime() : typeof vb === "number" ? vb : 0;
          cmp = da - db;
        } else if (col?.type === "boolean") {
          cmp = Number(!!va) - Number(!!vb);
        } else {
          cmp = String(va).localeCompare(String(vb));
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [items, searchQuery, sortKey, sortDir, mod.columns]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  function handleCsvImport(rows: Record<string, unknown>[]) {
    if (!mod.create || !farmId) return;
    let created = 0;
    let failed = 0;
    const promises = rows.map(async (row) => {
      try {
        await mod.create!(farmId, row);
        created++;
      } catch {
        failed++;
      }
    });
    Promise.all(promises).then(() => {
      toast.success(`Imported ${created} ${mod.label.toLowerCase()}${failed > 0 ? ` (${failed} failed)` : ""}`);
      queryClient.invalidateQueries({ queryKey: ["module-list", activeModuleId, farmId] });
    });
  }

  return (
    <DashboardShell
      title={meta.name}
      actions={
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button variant="secondary" onClick={() => {
              exportCsv(`${mod.label}-${new Date().toISOString().slice(0, 10)}.csv`, mod.columns, filteredItems);
              toast.success("CSV exported");
            }}>
              Export CSV
            </Button>
          )}
          {mod.create && (
            <Button variant="secondary" onClick={() => setShowImportDialog(true)}>
              Import CSV
            </Button>
          )}
          {moduleId === "pest-spray-log" && activeModuleId === moduleId && items.length > 0 && (
            <Button variant="secondary" onClick={handleExportPdf}>
              Export PDF
            </Button>
          )}
          {moduleId === "crop-planning" && activeModuleId === moduleId && items.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setViewMode((v) => v === "table" ? "calendar" : "table")}
            >
              {viewMode === "table" ? "Calendar View" : "Table View"}
            </Button>
          )}
          {moduleId === "financials" && activeModuleId === moduleId && items.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setViewMode((v) => v === "table" ? "roi" : "table")}
            >
              {viewMode === "table" ? "ROI View" : "Table View"}
            </Button>
          )}
          {mod.create && !bulkMode && (
            <Button onClick={openCreateForm}>+ Add {mod.label.replace(/s$/, "")}</Button>
          )}
          {mod.create && bulkMode && selectedIds.size > 0 && (
            <Button onClick={openCreateForm}>Bulk Add ({selectedIds.size})</Button>
          )}
          {mod.create && mod.formFields.some((f) => f.foreignKey) && (
            <Button variant="secondary" onClick={() => { setBulkMode((b) => !b); setSelectedIds(new Set()); }}>
              {bulkMode ? "Cancel Bulk" : "Bulk Entry"}
            </Button>
          )}
        </div>
      }
    >
      {tabs.length > 1 && (
        <div className="mb-4 flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTabId(tab.id); setShowForm(false); setEditingId(null); setViewMode("table"); }}
              className={[
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeModuleId === tab.id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {showForm && (() => {
        // Group form fields by section. Fields without a section go in the default group.
        const visibleFields = mod.formFields.filter((f) => !(bulkMode && f.foreignKey));
        const sections = new Map<string, typeof visibleFields>();
        for (const field of visibleFields) {
          const key = field.section ?? "";
          const group = sections.get(key) ?? [];
          group.push(field);
          sections.set(key, group);
        }
        const hasSections = visibleFields.some((f) => f.section);
        const sectionEntries = Array.from(sections.entries());

        return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            {editingId ? "Edit" : "New"} {mod.label.replace(/s$/, "")}
          </h3>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sectionEntries.map(([sectionName, fields], si) => (
              <div key={sectionName || si} className={sectionEntries.length > 1 ? "sm:col-span-2" : ""}>
                {hasSections && sectionName && (
                  <h4 className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {sectionName}
                  </h4>
                )}
                {hasSections && !sectionName && si > 0 && (
                  <h4 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Details
                  </h4>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      {field.label}
                    </label>
                    {field.type === "select" && field.foreignKey ? (
                      <ForeignKeySelect
                        farmId={farmId}
                        moduleId={field.foreignKey.moduleId}
                        labelField={field.foreignKey.labelField}
                        value={formValues[field.key] ?? ""}
                        onChange={(value) => setFormValues((v) => ({ ...v, [field.key]: value }))}
                        placeholder={`Select ${field.label}`}
                        required={field.required}
                      />
                    ) : field.type === "select" && field.optionsKey ? (
                      <SelectWithCustom
                        farmId={farmId}
                        countryId={countryProfile?.id}
                        listKey={field.optionsKey}
                        value={formValues[field.key] ?? ""}
                        onChange={(value) => setFormValues((v) => ({ ...v, [field.key]: value }))}
                        placeholder={`Select ${field.label}`}
                        required={field.required}
                      />
                    ) : field.type === "select" ? (
                      <Select
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        options={field.options ?? []}
                        placeholder={`Select ${field.label}`}
                      />
                    ) : field.type === "textarea" ? (
                      <textarea
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
                        rows={3}
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Create"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
        );
      })()}

      {/* Withholding Period Alerts */}
      {withholdingAlerts.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-red-700">Active Withholding Periods</h3>
          <div className="flex flex-col gap-1">
            {withholdingAlerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-red-800">{alert.chemicalName}</span>
                <span className="text-red-600">
                  {alert.daysRemaining} day{alert.daysRemaining !== 1 ? "s" : ""} remaining (until {alert.endDate.toLocaleDateString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">No {mod.label.toLowerCase()} yet.</p>
          {mod.create && (
            <Button className="mt-3" onClick={openCreateForm}>
              + Add first {mod.label.replace(/s$/, "").toLowerCase()}
            </Button>
          )}
        </div>
      ) : moduleId === "financials" && viewMode === "roi" ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 font-medium text-gray-600">Enterprise</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">Income</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">Expense</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roiRows.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">{row.label}</td>
                  <td className="px-4 py-2.5 text-gray-700">{row.income.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-gray-700">{row.expense.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-2.5 font-medium ${row.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {row.profit.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {roiRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No ledger entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : moduleId === "crop-planning" && viewMode === "calendar" ? (
        <div>
          {/* Search / Filter */}
          <div className="mb-3">
            <Input
              type="text"
              placeholder={`Search ${mod.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <PlantingCalendar
            plans={filteredItems.map((item) => ({
              id: String(item.id),
              cropVariety: String(item.cropVariety ?? ""),
              plannedPlantDate: item.plannedPlantDate instanceof Date
                ? item.plannedPlantDate
                : typeof item.plannedPlantDate === "number"
                  ? new Date(item.plannedPlantDate)
                  : null,
              plannedHarvestDate: item.plannedHarvestDate instanceof Date
                ? item.plannedHarvestDate
                : typeof item.plannedHarvestDate === "number"
                  ? new Date(item.plannedHarvestDate)
                  : null,
              status: String(item.status ?? "PLANNED"),
            }))}
            onPlanClick={(planId) => {
              const item = items.find((i) => String(i.id) === planId);
              if (item) openEditForm(item);
            }}
          />
        </div>
      ) : (
        <>
          {/* Bulk Mode Hint */}
          {bulkMode && (
            <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              Bulk entry mode: check the items to log against, then click "Bulk Add ({selectedIds.size})".
            </div>
          )}
          {/* Search / Filter */}
          <div className="mb-3">
            <Input
              type="text"
              placeholder={`Search ${mod.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {bulkMode && (
                    <th className="w-10 px-2 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === paginatedItems.length && paginatedItems.length > 0}
                        onChange={() => {
                          if (selectedIds.size === paginatedItems.length) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(new Set(paginatedItems.map((item) => String(item.id))));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </th>
                  )}
                  {mod.columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-2.5 font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key ? (
                          <span className="text-green-600">
                            {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">\u25B2\u25BC</span>
                        )}
                      </span>
                    </th>
                  ))}
                  {(mod.update || mod.delete) && (
                    <th className="px-4 py-2.5 text-right font-medium text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {bulkMode && filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={mod.columns.length + 2} className="px-4 py-4 text-center text-sm text-gray-500">
                        Select items from the table to bulk-add records
                      </td>
                    </tr>
                  )}
                  {paginatedItems.map((item) => (
                    <>
                    <tr key={String(item.id)} className={`hover:bg-gray-50 ${selectedIds.has(String(item.id)) ? "bg-green-50" : ""}`}>
                      {bulkMode && (
                        <td className="w-10 px-2 py-2.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(String(item.id))}
                            onChange={() => {
                              const next = new Set(selectedIds);
                              if (next.has(String(item.id))) {
                                next.delete(String(item.id));
                              } else {
                                next.add(String(item.id));
                              }
                              setSelectedIds(next);
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </td>
                      )}
                      {mod.columns.map((col) => (
                      <td key={col.key} className="px-4 py-2.5 text-gray-700">
                        {formatValue(item[col.key], col)}
                      </td>
                    ))}
                      {(mod.update || mod.delete) && (
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {farmId && (
                              <Button variant="ghost" size="sm" onClick={() => setPhotoRecordId(photoRecordId === String(item.id) ? null : String(item.id))}>
                                {photoRecordId === String(item.id) ? "Hide" : "Photos"}
                              </Button>
                            )}
                            {mod.update && (
                            <Button variant="ghost" size="sm" onClick={() => openEditForm(item)}>
                              Edit
                            </Button>
                          )}
                          {mod.delete && (
                            deleteConfirmId === String(item.id) ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-red-600">Delete?</span>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(String(item.id))}>
                                  Yes
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                                  No
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(String(item.id))}>
                                Delete
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {photoRecordId === String(item.id) && farmId != null ? (
                    <tr>
                      <td colSpan={99} className="bg-gray-50 px-4 pb-3">
                        <PhotoAttachments farmId={farmId} moduleId={activeModuleId} recordId={String(item.id)} />
                      </td>
                    </tr>
                  ) : null}
                    </>
                  ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={mod.columns.length + (mod.update || mod.delete ? 1 : 0) + (bulkMode ? 1 : 0)} className="px-4 py-4 text-center text-gray-500">
                      No matching {mod.label.toLowerCase()} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredItems.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="ml-2">
                  {(safeCurrentPage - 1) * pageSize + 1}–{Math.min(safeCurrentPage * pageSize, filteredItems.length)} of {filteredItems.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (safeCurrentPage <= 4) {
                    page = i + 1;
                  } else if (safeCurrentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = safeCurrentPage - 3 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === safeCurrentPage ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <CsvImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleCsvImport}
        formFields={mod.formFields}
        label={mod.label}
      />
    </DashboardShell>
  );
}