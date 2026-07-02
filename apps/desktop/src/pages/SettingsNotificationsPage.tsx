// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell, Button } from "@tpt/ui";
import { toast } from "sonner";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useFarm } from "../farm/FarmContext.js";
import {
  REMINDER_SOURCES,
  DEFAULT_NOTIFICATION_SETTINGS,
  resolveNotificationSettings,
} from "../notifications/reminder-sources.js";

export function SettingsNotificationsPage() {
  const { farmId } = useFarm();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(DEFAULT_NOTIFICATION_SETTINGS.enabled);
  const [leadDays, setLeadDays] = useState(DEFAULT_NOTIFICATION_SETTINGS.leadDays);
  const [mutedSourceIds, setMutedSourceIds] = useState<string[]>(DEFAULT_NOTIFICATION_SETTINGS.mutedSourceIds);

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
      const resolved = resolveNotificationSettings(farm.settingsJson?.notifications);
      setEnabled(resolved.enabled);
      setLeadDays(resolved.leadDays);
      setMutedSourceIds(resolved.mutedSourceIds);
    }
  }, [farm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!farmId) throw new Error("No farm found");
      const db = await getDb();
      await db
        .update(farms)
        .set({
          settingsJson: {
            ...(farm?.settingsJson ?? {}),
            notifications: { enabled, leadDays, mutedSourceIds },
          },
          updatedAt: new Date(),
        })
        .where(eq(farms.id, farmId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farm-settings", farmId] });
      toast.success("Notification settings updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update notification settings");
    },
  });

  function toggleSource(sourceId: string) {
    setMutedSourceIds((prev) => (prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]));
  }

  return (
    <DashboardShell title="Notifications">
      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
        <p className="mb-4 text-sm text-gray-500">
          Configure reminders for withholding periods, harvests, plantings and livestock tasks.
        </p>

        <label className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-800">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enable reminders
        </label>

        <label className="mb-4 block text-sm font-medium text-gray-800">
          Remind me this many days in advance
          <input
            type="number"
            min={0}
            max={60}
            value={leadDays}
            onChange={(e) => setLeadDays(Number(e.target.value))}
            disabled={!enabled}
            className="mt-1 block w-24 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
          />
        </label>

        <div className="mb-4">
          <div className="mb-2 text-sm font-medium text-gray-800">Reminder types</div>
          <div className="space-y-2">
            {REMINDER_SOURCES.map((source) => (
              <label key={source.id} className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!mutedSourceIds.includes(source.id)}
                  onChange={() => toggleSource(source.id)}
                  disabled={!enabled}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">{source.label}</span>
                  <span className="block text-xs text-gray-500">{source.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>
    </DashboardShell>
  );
}
