// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ModuleAdapter } from "./module-adapter.js";
import { MODULE_ADAPTERS, getLocaleAwareAdapter } from "./registry.js";
import { writeAuditLog } from "../audit/audit-service.js";

/**
 * Get module adapter - uses locale-aware version if locale is provided
 */
export function getModuleAdapter(moduleId: string, locale?: string, chemicalRegLabel?: string, traceabilityTagLabel?: string): ModuleAdapter | undefined {
  // If locale or a dynamic regulatory label is provided, use the locale-aware adapter
  if (locale !== undefined || chemicalRegLabel || traceabilityTagLabel) {
    return getLocaleAwareAdapter(moduleId, locale, chemicalRegLabel, traceabilityTagLabel) ?? undefined;
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
    mutationFn: async (data: Record<string, unknown>) => {
      const after = await adapter!.create!(farmId, data);
      await writeAuditLog(farmId, adapter!.primaryTable, String(after.id), "CREATE", null, after);
      return after;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}

export function useModuleUpdate(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const before = queryClient
        .getQueryData<Record<string, unknown>[]>(["module", moduleId, "list", farmId])
        ?.find((item) => String(item.id) === id);
      const after = await adapter!.update!(farmId, id, data);
      await writeAuditLog(farmId, adapter!.primaryTable, id, "UPDATE", before ?? null, after);
      return after;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}

export function useModuleDelete(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: async (id: string) => {
      const before = queryClient
        .getQueryData<Record<string, unknown>[]>(["module", moduleId, "list", farmId])
        ?.find((item) => String(item.id) === id);
      await adapter!.delete!(farmId, id);
      await writeAuditLog(farmId, adapter!.primaryTable, id, "DELETE", before ?? null, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}