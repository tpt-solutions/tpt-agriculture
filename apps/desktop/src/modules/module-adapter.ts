// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0

export interface ColumnDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "boolean";
  format?: (value: unknown) => string;
}

export interface FormFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Reference-data list key (see `DEFAULT_OPTIONS` in `@tpt/core`) — renders as a
   * dropdown of default + farm-added values with a "+ Add new…" option. */
  optionsKey?: string;
  /** Renders a dropdown of live records from another module (e.g. picking which
   * Flock a lambing record belongs to) instead of a static/reference list. */
  foreignKey?: { moduleId: string; labelField: string };
  /** Marks a `type: "select"` Yes/No field as backing a real boolean column, so
   * form submission converts the "true"/"false" string to an actual boolean. */
  boolean?: true;
  placeholder?: string;
  /** Optional section heading — fields sharing the same section string are grouped
   *  under a heading in the form. Fields without a section render in the default group. */
  section?: string;
  /** Optional small helper line rendered under the field (e.g. "Auto-calculated — override if needed"). */
  helpText?: string;
}

export interface ModuleAdapter {
  moduleId: string;
  label: string;
  primaryTable: string;
  columns: ColumnDef[];
  formFields: FormFieldDef[];
  /** Which columns contain dates that should appear on the farm calendar.
   *  Each entry maps a date column to a display label and navigation path. */
  dateFields?: { column: string; label: string; path: string }[];
  list(farmId: string): Promise<Record<string, unknown>[]>;
  count?(farmId: string): Promise<number>;
  get?(farmId: string, id: string): Promise<Record<string, unknown> | null>;
  create?(farmId: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update?(farmId: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  delete?(farmId: string, id: string): Promise<void>;
}