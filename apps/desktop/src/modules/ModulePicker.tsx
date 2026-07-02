// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { MODULE_REGISTRY, BUNDLE_MODULES } from "@tpt/core";
import { Button } from "@tpt/ui";
import { MODULE_ADAPTERS } from "./registry.js";

const AVAILABLE_MODULE_IDS = Object.keys(MODULE_ADAPTERS);
const HORTICULTURE_IDS = BUNDLE_MODULES.HORTICULTURE.filter((id) => AVAILABLE_MODULE_IDS.includes(id));
const LIVESTOCK_IDS = BUNDLE_MODULES.LIVESTOCK.filter((id) => AVAILABLE_MODULE_IDS.includes(id));

interface ModulePickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function ModulePicker({ selected, onChange }: ModulePickerProps) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id]);
  }

  function applyPreset(ids: string[]) {
    onChange(ids);
  }

  function renderGroup(title: string, ids: string[]) {
    return (
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ids.map((id) => (
            <label
              key={id}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer hover:border-green-400"
            >
              <input
                type="checkbox"
                checked={selected.includes(id)}
                onChange={() => toggle(id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {MODULE_REGISTRY[id]?.name ?? id}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset(HORTICULTURE_IDS)}>
          Horticulture
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset(LIVESTOCK_IDS)}>
          Livestock
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => applyPreset(AVAILABLE_MODULE_IDS)}
        >
          Everything
        </Button>
      </div>
      {renderGroup("Horticulture", HORTICULTURE_IDS)}
      {renderGroup("Livestock", LIVESTOCK_IDS)}
    </div>
  );
}
