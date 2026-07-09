// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ModuleAdapter } from "./module-adapter.js";
import { MODULE_ADAPTERS, getLocaleAwareAdapter } from "./registry.js";

/**
 * Get module adapter - uses locale-aware version if locale is provided
 */
export function getModuleAdapter(moduleId: string, locale?: string, chemicalRegLabel?: string): ModuleAdapter | undefined {
  // If locale or chemical reg label is provided, use the locale-aware adapter
  if (locale !== undefined || chemicalRegLabel) {
    return getLocaleAwareAdapter(moduleId, locale, chemicalRegLabel) ?? undefined;
  }
  return MODULE_ADAPTERS[moduleId];
}

/**
 * Hook to get locale-aware module adapter (used by ModulePage)
 */
export function useModuleList(moduleId: string, farmId: string | undefined) {
  const adapter = MODULE_ADAPTERS[moduleId];
  return useQuery({
    queryKey: ["module", moduleId, "list", farmId],
    queryFn: () => adapter?.list(farmId!),
    enabled: !!adapter && !!farmId,
  });
}

export function useModuleCreate(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adapter!.create!(farmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}

export function useModuleUpdate(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adapter!.update!(farmId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}

export function useModuleDelete(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: (id: string) => adapter!.delete!(farmId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}

/**
 * Bulk-create hook: creates N records (one per parent ID) with the same event data.
 * Skips the `parentIdField` in `data` and uses `parentIds` instead.
 */
export function useModuleBulkCreate(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: async ({
      parentIds,
      parentIdField,
      data,
    }: {
      parentIds: string[];
      parentIdField?: string;
      data: Record<string, unknown>;
    }) => {
      if (!adapter?.create) throw new Error("Adapter does not support create");
      await Promise.all(
        parentIds.map(async (parentId) => {
          const record = { ...data };
          if (parentIdField) record[parentIdField] = parentId;
          return adapter.create!(farmId, record);
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
      queryClient.invalidateQueries({ queryKey: ["module-counts", farmId] });
    },
  });
}