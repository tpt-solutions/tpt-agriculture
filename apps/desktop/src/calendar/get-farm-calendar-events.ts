// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { MODULE_REGISTRY } from "@tpt/core";
import { getModuleAdapter } from "../modules/use-module-query.js";

export interface CalendarEvent {
  id: string;
  moduleId: string;
  moduleLabel: string;
  date: Date;
  label: string;
  path: string;
  /** Row ID for the source record (for click-through) */
  recordId?: string;
}

/**
 * Scans all modules with `dateFields` and returns a unified list of calendar
 * events for the given farm. Used by the calendar UI (Phase 20f) and can also
 * feed the dashboard upcoming-events strip.
 */
export async function getFarmCalendarEvents(
  farmId: string,
  locale?: string,
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  for (const [moduleId, meta] of Object.entries(MODULE_REGISTRY)) {
    const adapter = getModuleAdapter(moduleId, locale);
    if (!adapter?.dateFields || adapter.dateFields.length === 0) continue;

    try {
      const rows = await adapter.list(farmId);
      for (const row of rows) {
        for (const df of adapter.dateFields) {
          const raw = row[df.column];
          if (raw == null) continue;
          const date = raw instanceof Date ? raw : new Date(raw as string | number);
          if (isNaN(date.getTime())) continue;
          events.push({
            id: `${moduleId}.${df.column}.${row.id}`,
            moduleId,
            moduleLabel: meta.name,
            date,
            label: df.label,
            path: df.path,
            recordId: row.id != null ? String(row.id) : undefined,
          });
        }
      }
    } catch {
      // Module query failed — skip silently (module may not be enabled)
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}
