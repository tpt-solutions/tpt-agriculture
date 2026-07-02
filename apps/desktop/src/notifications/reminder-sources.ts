// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { getDb } from "@tpt/core";
import {
  sprayEvents,
  chemicals,
  cropPlans,
  sheepDrenchingRecords,
  sheepFlocks,
  pigLitters,
  pigSows,
  beeHives,
  beeInspections,
} from "@tpt/core/schema";
import { eq, and, gt, asc, isNull, desc } from "drizzle-orm";

export type ReminderSeverity = "overdue" | "due-soon" | "upcoming";

export interface ReminderItem {
  id: string;
  sourceId: string;
  label: string;
  detail: string;
  date: Date;
  path: string;
  severity: ReminderSeverity;
}

export interface ReminderSource {
  id: string;
  label: string;
  description: string;
  fetch(farmId: string, db: Awaited<ReturnType<typeof getDb>>, leadDays: number): Promise<ReminderItem[]>;
}

function daysFromNow(date: Date, now: Date): number {
  return (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
}

function severityFor(date: Date, leadDays: number, now: Date): ReminderSeverity {
  const days = daysFromNow(date, now);
  if (days < 0) return "overdue";
  if (days <= leadDays) return "due-soon";
  return "upcoming";
}

const withholdingSource: ReminderSource = {
  id: "pest-spray-log.withholding",
  label: "Spray Withholding Periods",
  description: "Chemical withholding periods still in effect",
  async fetch(farmId, db, leadDays) {
    const now = new Date();
    const rows = await db
      .select({
        id: sprayEvents.id,
        withholdingEndDate: sprayEvents.withholdingEndDate,
        chemicalId: sprayEvents.chemicalId,
      })
      .from(sprayEvents)
      .where(and(eq(sprayEvents.farmId, farmId), gt(sprayEvents.withholdingEndDate, now)))
      .orderBy(asc(sprayEvents.withholdingEndDate))
      .limit(10);

    const items: ReminderItem[] = [];
    for (const row of rows) {
      if (!row.withholdingEndDate) continue;
      let chemicalName = "Unknown chemical";
      if (row.chemicalId) {
        const [chem] = await db.select({ name: chemicals.name }).from(chemicals).where(eq(chemicals.id, row.chemicalId)).limit(1);
        if (chem) chemicalName = chem.name;
      }
      items.push({
        id: `${this.id}.${row.id}`,
        sourceId: this.id,
        label: "Withholding Period",
        detail: chemicalName,
        date: row.withholdingEndDate,
        path: "/modules/pest-spray-log",
        severity: severityFor(row.withholdingEndDate, leadDays, now),
      });
    }
    return items;
  },
};

const harvestSource: ReminderSource = {
  id: "crop-planning.harvest",
  label: "Planned Harvests",
  description: "Crops due for harvest",
  async fetch(farmId, db, leadDays) {
    const now = new Date();
    const rows = await db
      .select({ id: cropPlans.id, cropVariety: cropPlans.cropVariety, plannedHarvestDate: cropPlans.plannedHarvestDate })
      .from(cropPlans)
      .where(and(eq(cropPlans.farmId, farmId), gt(cropPlans.plannedHarvestDate, now), eq(cropPlans.status, "IN_PROGRESS")))
      .orderBy(asc(cropPlans.plannedHarvestDate))
      .limit(10);

    return rows
      .filter((r) => !!r.plannedHarvestDate)
      .map((r) => ({
        id: `${this.id}.${r.id}`,
        sourceId: this.id,
        label: "Planned Harvest",
        detail: r.cropVariety,
        date: r.plannedHarvestDate as Date,
        path: "/modules/crop-planning",
        severity: severityFor(r.plannedHarvestDate as Date, leadDays, now),
      }));
  },
};

const plantingSource: ReminderSource = {
  id: "crop-planning.planting",
  label: "Planned Plantings",
  description: "Crops scheduled to be planted",
  async fetch(farmId, db, leadDays) {
    const now = new Date();
    const rows = await db
      .select({ id: cropPlans.id, cropVariety: cropPlans.cropVariety, plannedPlantDate: cropPlans.plannedPlantDate })
      .from(cropPlans)
      .where(and(eq(cropPlans.farmId, farmId), gt(cropPlans.plannedPlantDate, now), eq(cropPlans.status, "PLANNED")))
      .orderBy(asc(cropPlans.plannedPlantDate))
      .limit(10);

    return rows
      .filter((r) => !!r.plannedPlantDate)
      .map((r) => ({
        id: `${this.id}.${r.id}`,
        sourceId: this.id,
        label: "Planned Planting",
        detail: r.cropVariety,
        date: r.plannedPlantDate as Date,
        path: "/modules/crop-planning",
        severity: severityFor(r.plannedPlantDate as Date, leadDays, now),
      }));
  },
};

const sheepDrenchWithholdingSource: ReminderSource = {
  id: "sheep.drenching-withholding",
  label: "Sheep Drenching Withholding",
  description: "Meat withholding periods from drenching still in effect",
  async fetch(farmId, db, leadDays) {
    const now = new Date();
    const flocks = await db.select({ id: sheepFlocks.id }).from(sheepFlocks).where(eq(sheepFlocks.farmId, farmId));
    if (flocks.length === 0) return [];

    const items: ReminderItem[] = [];
    for (const flock of flocks) {
      const rows = await db
        .select({ id: sheepDrenchingRecords.id, date: sheepDrenchingRecords.date, product: sheepDrenchingRecords.product, withholdingMeat: sheepDrenchingRecords.withholdingMeat })
        .from(sheepDrenchingRecords)
        .where(eq(sheepDrenchingRecords.flockId, flock.id));

      for (const row of rows) {
        if (!row.withholdingMeat || row.withholdingMeat <= 0) continue;
        const endDate = new Date(row.date.getTime() + row.withholdingMeat * 24 * 60 * 60 * 1000);
        if (endDate <= now) continue;
        items.push({
          id: `${this.id}.${row.id}`,
          sourceId: this.id,
          label: "Meat Withholding",
          detail: row.product,
          date: endDate,
          path: "/modules/sheep",
          severity: severityFor(endDate, leadDays, now),
        });
      }
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
  },
};

const pigWeaningSource: ReminderSource = {
  id: "pigs.weaning",
  label: "Pig Weaning",
  description: "Litters due to be weaned",
  async fetch(farmId, db, leadDays) {
    const now = new Date();
    const sows = await db.select({ id: pigSows.id }).from(pigSows).where(eq(pigSows.farmId, farmId));
    if (sows.length === 0) return [];

    const items: ReminderItem[] = [];
    for (const sow of sows) {
      const rows = await db
        .select({ id: pigLitters.id, weanDate: pigLitters.weanDate, pigletsWeaned: pigLitters.pigletsWeaned })
        .from(pigLitters)
        .where(and(eq(pigLitters.sowId, sow.id), isNull(pigLitters.pigletsWeaned)));

      for (const row of rows) {
        if (!row.weanDate) continue;
        items.push({
          id: `${this.id}.${row.id}`,
          sourceId: this.id,
          label: "Weaning Due",
          detail: "Litter",
          date: row.weanDate,
          path: "/modules/pigs",
          severity: severityFor(row.weanDate, leadDays, now),
        });
      }
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
  },
};

const BEE_INSPECTION_INTERVAL_DAYS = 21;

const beeInspectionSource: ReminderSource = {
  id: "bees.inspection",
  label: "Hive Inspections",
  description: "Hives due for their next inspection",
  async fetch(farmId, db, leadDays) {
    const now = new Date();
    const hives = await db
      .select({ id: beeHives.id, hiveName: beeHives.hiveName, createdAt: beeHives.createdAt })
      .from(beeHives)
      .where(and(eq(beeHives.farmId, farmId), eq(beeHives.status, "ACTIVE")));
    if (hives.length === 0) return [];

    const items: ReminderItem[] = [];
    for (const hive of hives) {
      const [lastInspection] = await db
        .select({ date: beeInspections.date })
        .from(beeInspections)
        .where(eq(beeInspections.hiveId, hive.id))
        .orderBy(desc(beeInspections.date))
        .limit(1);

      const lastDate = lastInspection?.date ?? hive.createdAt;
      const nextDue = new Date(lastDate.getTime() + BEE_INSPECTION_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
      items.push({
        id: `${this.id}.${hive.id}`,
        sourceId: this.id,
        label: "Inspection Due",
        detail: hive.hiveName,
        date: nextDue,
        path: "/modules/bees",
        severity: severityFor(nextDue, leadDays, now),
      });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
  },
};

export const REMINDER_SOURCES: ReminderSource[] = [
  withholdingSource,
  harvestSource,
  plantingSource,
  sheepDrenchWithholdingSource,
  pigWeaningSource,
  beeInspectionSource,
];

export interface NotificationSettings {
  enabled: boolean;
  leadDays: number;
  mutedSourceIds: string[];
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  leadDays: 7,
  mutedSourceIds: [],
};

export function resolveNotificationSettings(raw: unknown): NotificationSettings {
  const value = (raw ?? {}) as Partial<NotificationSettings>;
  return {
    enabled: value.enabled ?? DEFAULT_NOTIFICATION_SETTINGS.enabled,
    leadDays: value.leadDays ?? DEFAULT_NOTIFICATION_SETTINGS.leadDays,
    mutedSourceIds: value.mutedSourceIds ?? DEFAULT_NOTIFICATION_SETTINGS.mutedSourceIds,
  };
}

export async function getReminders(farmId: string, settings: NotificationSettings): Promise<ReminderItem[]> {
  if (!settings.enabled) return [];
  const db = await getDb();
  const activeSources = REMINDER_SOURCES.filter((s) => !settings.mutedSourceIds.includes(s.id));

  const results = await Promise.all(
    activeSources.map(async (source) => {
      try {
        return await source.fetch(farmId, db, settings.leadDays);
      } catch {
        return [];
      }
    })
  );

  return results.flat().sort((a, b) => a.date.getTime() - b.date.getTime());
}
