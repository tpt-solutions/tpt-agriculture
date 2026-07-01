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
  placeholder?: string;
}

export interface ModuleAdapter {
  moduleId: string;
  label: string;
  primaryTable: string;
  columns: ColumnDef[];
  formFields: FormFieldDef[];
  list(farmId: string): Promise<Record<string, unknown>[]>;
  count?(farmId: string): Promise<number>;
  get?(farmId: string, id: string): Promise<Record<string, unknown> | null>;
  create?(farmId: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update?(farmId: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  delete?(farmId: string, id: string): Promise<void>;
}