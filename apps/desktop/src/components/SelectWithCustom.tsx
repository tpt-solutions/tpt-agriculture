// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { Select } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { useOptionsWithCustom } from "../reference/useOptionsWithCustom.js";

const ADD_NEW_SENTINEL = "__add_new__";

interface SelectWithCustomProps {
  farmId: string | null;
  listKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function SelectWithCustom({
  farmId,
  listKey,
  value,
  onChange,
  placeholder,
  required,
}: SelectWithCustomProps) {
  const { options, addCustom } = useOptionsWithCustom(farmId, listKey);
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  async function handleAdd() {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    await addCustom(trimmed);
    onChange(trimmed);
    setAdding(false);
    setNewValue("");
  }

  if (adding) {
    return (
      <div className="flex gap-1.5">
        <Input
          autoFocus
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="New value"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" size="sm" onClick={handleAdd}>
          Add
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(e) => {
        if (e.target.value === ADD_NEW_SENTINEL) {
          setAdding(true);
          return;
        }
        onChange(e.target.value);
      }}
      options={[...options, { value: ADD_NEW_SENTINEL, label: "+ Add new…" }]}
    />
  );
}
