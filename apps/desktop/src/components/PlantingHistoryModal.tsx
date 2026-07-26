// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery } from "@tanstack/react-query";
import { getDb } from "@tpt/core";
import { cropPlans, harvestBatches, sprayEvents, fertiliserApplications, chemicals } from "@tpt/core/schema";
import { eq, desc } from "drizzle-orm";

interface Props {
  farmId: string;
  fieldId: string;
  fieldName: string;
  onClose: () => void;
}

interface HistoryEvent {
  id: string;
  type: "planting" | "harvest" | "spray" | "fertiliser";
  date: Date | null;
  detail: string;
  extra?: string;
}

function formatDate(d: Date | number | null): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString();
}

export function PlantingHistoryModal({ farmId, fieldId, fieldName, onClose }: Props) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["field-history", farmId, fieldId],
    queryFn: async (): Promise<HistoryEvent[]> => {
      const db = await getDb();
      const result: HistoryEvent[] = [];

      // Crop plans linked to this field
      const plans = await db
        .select()
        .from(cropPlans)
        .where(eq(cropPlans.fieldId, fieldId))
        .orderBy(desc(cropPlans.plannedPlantDate));

      for (const p of plans) {
        result.push({
          id: `plan-${p.id}`,
          type: "planting",
          date: p.plannedPlantDate instanceof Date ? p.plannedPlantDate : p.plannedPlantDate ? new Date(p.plannedPlantDate) : null,
          detail: p.cropVariety ?? "Unknown crop",
          extra: p.status ?? "PLANNED",
        });
      }

      // Harvest batches linked to this field
      const harvests = await db
        .select()
        .from(harvestBatches)
        .where(eq(harvestBatches.fieldId, fieldId))
        .orderBy(desc(harvestBatches.harvestDate));

      for (const h of harvests) {
        const yieldStr = h.totalYieldKg != null ? `${h.totalYieldKg} kg` : "";
        result.push({
          id: `harvest-${h.id}`,
          type: "harvest",
          date: h.harvestDate instanceof Date ? h.harvestDate : h.harvestDate ? new Date(h.harvestDate) : null,
          detail: h.cropVariety ?? "Unknown crop",
          extra: yieldStr,
        });
      }

      // Spray events linked to this field
      const sprays = await db
        .select({ id: sprayEvents.id, applicationDate: sprayEvents.applicationDate, chemicalId: sprayEvents.chemicalId, ratePerHa: sprayEvents.ratePerHa })
        .from(sprayEvents)
        .where(eq(sprayEvents.fieldId, fieldId))
        .orderBy(desc(sprayEvents.applicationDate));

      for (const s of sprays) {
        let chemName = "Unknown";
        if (s.chemicalId) {
          const [chem] = await db.select({ name: chemicals.name }).from(chemicals).where(eq(chemicals.id, s.chemicalId)).limit(1);
          if (chem) chemName = chem.name;
        }
        const rateStr = s.ratePerHa != null ? `${s.ratePerHa}/ha` : "";
        result.push({
          id: `spray-${s.id}`,
          type: "spray",
          date: s.applicationDate instanceof Date ? s.applicationDate : s.applicationDate ? new Date(s.applicationDate) : null,
          detail: chemName,
          extra: rateStr,
        });
      }

      // Fertiliser applications linked to this field
      const ferts = await db
        .select()
        .from(fertiliserApplications)
        .where(eq(fertiliserApplications.fieldId, fieldId))
        .orderBy(desc(fertiliserApplications.date));

      for (const f of ferts) {
        const rateStr = f.rateKgHa != null ? `${f.rateKgHa} kg/ha` : "";
        result.push({
          id: `fert-${f.id}`,
          type: "fertiliser",
          date: f.date instanceof Date ? f.date : f.date ? new Date(f.date) : null,
          detail: f.productType ?? "Unknown product",
          extra: rateStr,
        });
      }

      // Sort by date descending
      result.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.getTime() - a.date.getTime();
      });

      return result;
    },
    enabled: !!farmId && !!fieldId,
  });

  const typeColors: Record<string, string> = {
    planting: "bg-blue-100 text-blue-700",
    harvest: "bg-green-100 text-green-700",
    spray: "bg-amber-100 text-amber-700",
    fertiliser: "bg-purple-100 text-purple-700",
  };

  const typeLabels: Record<string, string> = {
    planting: "Planting",
    harvest: "Harvest",
    spray: "Spray",
    fertiliser: "Fertiliser",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 max-h-[80vh] w-full max-w-lg rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">
            Planting History — {fieldName}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(80vh - 60px)" }}>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading history...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-gray-500">No planting history recorded for this field yet.</p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 rounded-md border border-gray-100 px-3 py-2">
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[ev.type]}`}>
                    {typeLabels[ev.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700">{ev.detail}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(ev.date)}{ev.extra ? ` — ${ev.extra}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
