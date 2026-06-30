import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MODULE_ADAPTERS } from "./registry.js";
import type { ModuleAdapter } from "./module-adapter.js";

export function getModuleAdapter(moduleId: string): ModuleAdapter | undefined {
  return MODULE_ADAPTERS[moduleId];
}

export function useModuleList(moduleId: string, farmId: string | undefined) {
  const adapter = MODULE_ADAPTERS[moduleId];
  return useQuery({
    queryKey: ["module", moduleId, "list", farmId],
    queryFn: () => adapter.list(farmId!),
    enabled: !!adapter && !!farmId,
  });
}

export function useModuleCreate(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adapter.create!(farmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}

export function useModuleUpdate(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adapter.update!(farmId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}

export function useModuleDelete(moduleId: string, farmId: string) {
  const queryClient = useQueryClient();
  const adapter = MODULE_ADAPTERS[moduleId];
  return useMutation({
    mutationFn: (id: string) => adapter.delete!(farmId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module", moduleId, "list", farmId] });
    },
  });
}
