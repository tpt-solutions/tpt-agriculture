// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { Combobox } from "@tpt/ui";
import { useOptionsWithCustom } from "../reference/useOptionsWithCustom.js";

interface SelectWithCustomProps {
  farmId: string | null;
  listKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  countryId?: string;
}

export function SelectWithCustom({
  farmId,
  listKey,
  value,
  onChange,
  placeholder,
  required,
  countryId,
}: SelectWithCustomProps) {
  const { options, addCustom } = useOptionsWithCustom(farmId, listKey, countryId);

  async function handleAddCustom(newValue: string) {
    await addCustom(newValue);
    onChange(newValue);
  }

  return (
    <Combobox
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={onChange}
      onAddCustom={handleAddCustom}
      options={options}
    />
  );
}
