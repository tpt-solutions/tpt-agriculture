import { useState } from "react";
import { useParams } from "react-router";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { Select } from "@tpt/ui";
import { useAuth } from "../auth/AuthContext.js";
import { MODULE_REGISTRY } from "@tpt/core";
import { useModuleList, useModuleCreate, useModuleUpdate, useModuleDelete, getModuleAdapter } from "../modules/use-module-query.js";

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { user } = useAuth();
  const meta = moduleId ? MODULE_REGISTRY[moduleId] : undefined;
  const adapter = moduleId ? getModuleAdapter(moduleId) : undefined;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useModuleList(moduleId ?? "", user?.farmId);
  const createMutation = useModuleCreate(moduleId ?? "", user?.farmId ?? "");
  const updateMutation = useModuleUpdate(moduleId ?? "", user?.farmId ?? "");
  const deleteMutation = useModuleDelete(moduleId ?? "", user?.farmId ?? "");

  if (!meta || !adapter) {
    return (
      <DashboardShell title="Module Not Found">
        <p className="text-sm text-gray-500">
          The module &quot;{moduleId}&quot; does not exist.
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
      updateMutation.mutate({ id: editingId, data }, { onSuccess: () => { setShowForm(false); setEditingId(null); } });
    } else {
      createMutation.mutate(data, { onSuccess: () => setShowForm(false) });
    }
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setDeleteConfirmId(null) });
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

  return (
    <DashboardShell
      title={meta.name}
      actions={
        mod.create ? (
          <Button onClick={openCreateForm}>+ Add {mod.label.replace(/s$/, "")}</Button>
        ) : undefined
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
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {mod.columns.map((col) => (
                  <th key={col.key} className="px-4 py-2.5 font-medium text-gray-600">
                    {col.label}
                  </th>
                ))}
                {(mod.update || mod.delete) && (
                  <th className="px-4 py-2.5 text-right font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
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
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
