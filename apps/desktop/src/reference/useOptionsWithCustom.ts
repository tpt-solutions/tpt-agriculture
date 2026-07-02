// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getDb, DEFAULT_OPTIONS } from "@tpt/core";
import { customOptions } from "@tpt/core/schema";
import { and, eq } from "drizzle-orm";

export interface SelectOption {
  value: string;
  label: string;
}

export function useOptionsWithCustom(farmId: string | null, listKey: string) {
  const queryClient = useQueryClient();

  const { data: customValues = [] } = useQuery({
    queryKey: ["custom-options", farmId, listKey],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      const rows = await db
        .select({ value: customOptions.value })
        .from(customOptions)
        .where(and(eq(customOptions.farmId, farmId), eq(customOptions.listKey, listKey)));
      return rows.map((r) => r.value);
    },
    enabled: !!farmId,
  });

  const defaults = DEFAULT_OPTIONS[listKey] ?? [];
  const merged = Array.from(new Set([...defaults, ...customValues])).sort();
  const options: SelectOption[] = merged.map((value) => ({ value, label: value }));

  const addCustomMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!farmId) throw new Error("No farm found");
      const db = await getDb();
      await db
        .insert(customOptions)
        .values({ farmId, listKey, value })
        .onConflictDoNothing();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-options", farmId, listKey] });
    },
  });

  async function addCustom(value: string): Promise<void> {
    await addCustomMutation.mutateAsync(value);
  }

  return { options, addCustom };
}
