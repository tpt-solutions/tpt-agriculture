// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { Select } from "@tpt/ui";
import { useModuleList } from "../modules/use-module-query.js";

/** Dropdown populated from another module's live records (e.g. picking which
 * Flock a lambing record belongs to), instead of a static reference list. */
export function ForeignKeySelect({
  farmId,
  moduleId,
  labelField,
  value,
  onChange,
  placeholder,
  required,
}: {
  farmId: string | null;
  moduleId: string;
  labelField: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const { data: items = [] } = useModuleList(moduleId, farmId ?? undefined);
  const options = items.map((item) => ({
    value: String(item.id),
    label: String(item[labelField] ?? item.id),
  }));

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      placeholder={placeholder}
      required={required}
    />
  );
}
