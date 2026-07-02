// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { toast } from "sonner";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useFarm } from "../farm/FarmContext.js";
import { ModulePicker } from "../modules/ModulePicker.js";

export function SettingsModulesPage() {
  const { farmId } = useFarm();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const { data: farm } = useQuery({
    queryKey: ["farm", farmId],
    queryFn: async () => {
      if (!farmId) return null;
      const db = await getDb();
      const [row] = await db.select().from(farms).where(eq(farms.id, farmId)).limit(1);
      return row;
    },
    enabled: !!farmId,
  });

  useEffect(() => {
    if (farm) {
      const ids = (farm.settingsJson?.enabledModuleIds as string[] | undefined) ?? [];
      setSelected(ids);
    }
  }, [farm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!farmId) throw new Error("No farm found");
      const db = await getDb();
      await db
        .update(farms)
        .set({
          settingsJson: { ...(farm?.settingsJson ?? {}), enabledModuleIds: selected },
          updatedAt: new Date(),
        })
        .where(eq(farms.id, farmId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
      toast.success("Modules updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update modules");
    },
  });

  return (
    <DashboardShell title="Modules">
      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
        <p className="mb-4 text-sm text-gray-500">
          Choose which parts of the farm show up in the sidebar and dashboard.
        </p>
        <ModulePicker selected={selected} onChange={setSelected} />
        <div className="mt-4">
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={selected.length === 0}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
