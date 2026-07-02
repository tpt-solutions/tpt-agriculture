// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useFarm } from "../farm/FarmContext.js";
import { useSettings } from "../context/FarmSettingsContext.js";
import { getReminders } from "./reminder-sources.js";
import type { ReminderItem, ReminderSeverity } from "./reminder-sources.js";

const SEVERITY_STYLES: Record<ReminderSeverity, { dot: string; text: string }> = {
  overdue: { dot: "bg-red-500", text: "text-red-700" },
  "due-soon": { dot: "bg-amber-500", text: "text-amber-700" },
  upcoming: { dot: "bg-gray-400", text: "text-gray-600" },
};

export function NotificationBell() {
  const { farmId } = useFarm();
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const notificationSettings = settings?.notifications;

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders", farmId, notificationSettings],
    queryFn: async () => {
      if (!farmId || !notificationSettings) return [];
      return getReminders(farmId, notificationSettings);
    },
    enabled: !!farmId && !!notificationSettings,
    staleTime: 60_000,
  });

  const actionable = reminders.filter((r: ReminderItem) => r.severity !== "upcoming");
  const badgeCount = actionable.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {badgeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
              Reminders
            </div>
            <div className="max-h-96 overflow-y-auto">
              {reminders.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Nothing due right now</div>
              )}
              {reminders.map((item: ReminderItem) => {
                const style = SEVERITY_STYLES[item.severity];
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2 border-b border-gray-50 px-4 py-2.5 text-sm last:border-b-0 hover:bg-gray-50"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                    <div>
                      <div className={`font-medium ${style.text}`}>{item.label}</div>
                      <div className="text-xs text-gray-500">{item.detail}</div>
                      <div className="text-xs text-gray-400">{item.date.toLocaleDateString()}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link
              to="/settings/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-gray-100 px-4 py-2 text-center text-xs font-medium text-green-700 hover:bg-gray-50"
            >
              Notification settings
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
