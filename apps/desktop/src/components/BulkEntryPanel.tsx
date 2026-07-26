// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select } from "@tpt/ui";
import { toast } from "sonner";
import { useFarm } from "../farm/FarmContext.js";
import { MODULE_ADAPTERS } from "../modules/registry.js";
import type { ModuleAdapter } from "../modules/module-adapter.js";

/**
 * Generic bulk-entry panel: log the same event against multiple parent records
 * (e.g. drench all flocks, weigh all mobs) in a single submission.
 *
 * Renders a multi-select for parent records, then a form with all the child
 * adapter's fields (minus the foreignKey parent picker). On submit, creates
 * one record per selected parent.
 */

interface ParentRecord {
  id: string;
  label: string;
}

export function BulkEntryPanel({
  parentModuleId,
  parentLabelField,
  childAdapter,
  onClose,
}: {
  /** The parent adapter module id (e.g. "sheep") to pull records from */
  parentModuleId: string;
  /** The column key on the parent adapter used as the display label */
  parentLabelField: string;
  /** The child adapter (e.g. "sheep-drenching") to create records in */
  childAdapter: ModuleAdapter;
  onClose: () => void;
}) {
  const { farmId } = useFarm();
  const queryClient = useQueryClient();
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // The foreignKey field that links child to parent
  const foreignKeyField = childAdapter.formFields.find((f) => f.foreignKey);
  // All form fields except the foreign key picker (we handle parent selection via multi-select)
  const dataFields = childAdapter.formFields.filter((f) => f !== foreignKeyField);

  // Fetch parent records for the multi-select
  const parentAdapter = MODULE_ADAPTERS[parentModuleId];
  const { data: parentRecords = [], isLoading } = useQuery({
    queryKey: ["module", parentModuleId, "list", farmId],
    queryFn: () => parentAdapter?.list(farmId!),
    enabled: !!parentAdapter && !!farmId,
  });

  const parents: ParentRecord[] = parentRecords.map((r) => ({
    id: String(r.id),
    label: String(r[parentLabelField] ?? r.name ?? r.animalId ?? r.batchName ?? r.hiveName ?? r.herdName ?? "—"),
  }));

  // Create mutation — fires once per selected parent
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!farmId || !foreignKeyField || selectedParentIds.length === 0) return;

      // Build the data payload from form values
      const data: Record<string, unknown> = {};
      for (const field of dataFields) {
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

      // Create one record per selected parent
      let created = 0;
      for (const parentId of selectedParentIds) {
        try {
          await childAdapter.create!(farmId, { ...data, [foreignKeyField.key]: parentId });
          created++;
        } catch {
          // skip failed records
        }
      }
      return created;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["module", childAdapter.moduleId, "list", farmId] });
      toast.success(`${count ?? 0} record${(count ?? 0) !== 1 ? "s" : ""} created`);
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Bulk create failed");
    },
  });

  function handleToggleParent(id: string) {
    setSelectedParentIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    setSelectedParentIds(parents.map((p) => p.id));
  }

  function handleDeselectAll() {
    setSelectedParentIds([]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Bulk Entry — {childAdapter.label}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {/* Parent multi-select */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">
              {foreignKeyField?.label ?? "Parent"} ({selectedParentIds.length} selected)
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={handleSelectAll} className="text-xs text-green-600 hover:underline">All</button>
              <button type="button" onClick={handleDeselectAll} className="text-xs text-gray-500 hover:underline">None</button>
            </div>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200">
              {parents.map((parent) => (
                <label
                  key={parent.id}
                  className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-1.5 text-sm last:border-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedParentIds.includes(parent.id)}
                    onChange={() => handleToggleParent(parent.id)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{parent.label}</span>
                </label>
              ))}
              {parents.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500">No records to select.</p>
              )}
            </div>
          )}
        </div>

        {/* Data fields form */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dataFields.map((field) => (
            <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
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
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={selectedParentIds.length === 0}
          >
            Create {selectedParentIds.length > 0 ? `${selectedParentIds.length} ` : ""}Record{selectedParentIds.length !== 1 ? "s" : ""}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
