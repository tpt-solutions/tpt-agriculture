// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { Select } from "@tpt/ui";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthContext.js";
import { useCountryProfile } from "../context/FarmSettingsContext.js";
import { MODULE_REGISTRY, getDb } from "@tpt/core";
import { farms, sprayEvents, chemicals } from "@tpt/core/schema";
import { eq, and, gt, asc } from "drizzle-orm";
import { useModuleList, useModuleCreate, useModuleUpdate, useModuleDelete, getModuleAdapter } from "../modules/use-module-query.js";
import { generateChemicalRegisterPdf, downloadPdf } from "../utils/pdf-export.js";
import { PlantingCalendar } from "../components/PlantingCalendar.js";

type SortDir = "asc" | "desc";

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { user } = useAuth();
  const meta = moduleId ? MODULE_REGISTRY[moduleId] : undefined;
  
  // Get locale and chemical reg label from country profile
  const countryProfile = useCountryProfile();
  const locale = countryProfile?.locale;
  const chemicalRegLabel = countryProfile?.regulatory?.chemicalRegNumber;
  
  // Use locale-aware adapter
  const adapter = moduleId ? getModuleAdapter(moduleId, locale, chemicalRegLabel) : undefined;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const { data: items = [], isLoading } = useModuleList(moduleId ?? "", user?.farmId);
  const createMutation = useModuleCreate(moduleId ?? "", user?.farmId ?? "");
  const updateMutation = useModuleUpdate(moduleId ?? "", user?.farmId ?? "");
  const deleteMutation = useModuleDelete(moduleId ?? "", user?.farmId ?? "");

  // Fetch farm name for PDF export
  const { data: farmData } = useQuery({
    queryKey: ["farm", user?.farmId],
    queryFn: async () => {
      if (!user) return null;
      const db = await getDb();
      const [row] = await db.select().from(farms).where(eq(farms.id, user.farmId)).limit(1);
      return row;
    },
    enabled: !!user,
  });

  // Active withholding period alerts (pest-spray-log only)
  const { data: withholdingAlerts = [] } = useQuery({
    queryKey: ["withholding-alerts", user?.farmId],
    queryFn: async () => {
      if (!user || moduleId !== "pest-spray-log") return [];
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
        .where(and(eq(sprayEvents.farmId, user.farmId), gt(sprayEvents.withholdingEndDate, now)))
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
    enabled: !!user && moduleId === "pest-spray-log",
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
    setFormValues({});
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
    for (const field of mod.formFields) {
      const raw = formValues[field.key];
      if (raw === "" || raw === undefined) {
        if (!field.required) continue;
        data[field.key] = null;
      } else if (field.type === "number") {
        data[field.key] = Number(raw);
      } else if (field.type === "date") {
        data[field.key] = new Date(raw);
      } else {
        data[field.key] = raw;
      }
    }

    if (editingId) {
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

  return (
    <DashboardShell
      title={meta.name}
      actions={
        <div className="flex items-center gap-2">
          {moduleId === "pest-spray-log" && items.length > 0 && (
            <Button variant="secondary" onClick={handleExportPdf}>
              Export PDF
            </Button>
          )}
          {moduleId === "crop-planning" && items.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setViewMode((v) => v === "table" ? "calendar" : "table")}
            >
              {viewMode === "table" ? "Calendar View" : "Table View"}
            </Button>
          )}
          {mod.create && (
            <Button onClick={openCreateForm}>+ Add {mod.label.replace(/s$/, "")}</Button>
          )}
        </div>
      }
    >
      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            {editingId ? "Edit" : "New"} {mod.label.replace(/s$/, "")}
          </h3>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {mod.formFields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {field.label}
                </label>
                {field.type === "select" ? (
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
      )}

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
                {filteredItems.map((item) => (
                  <tr key={String(item.id)} className="hover:bg-gray-50">
                    {mod.columns.map((col) => (
                      <td key={col.key} className="px-4 py-2.5 text-gray-700">
                        {formatValue(item[col.key], col)}
                      </td>
                    ))}
                    {(mod.update || mod.delete) && (
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={mod.columns.length + (mod.update || mod.delete ? 1 : 0)} className="px-4 py-4 text-center text-gray-500">
                      No matching {mod.label.toLowerCase()} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardShell>
  );
}