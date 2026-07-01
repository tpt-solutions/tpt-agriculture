// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0

interface CropPlan {
  id: string;
  cropVariety: string;
  plannedPlantDate: Date | null;
  plannedHarvestDate: Date | null;
  status: string;
}

interface PlantingCalendarProps {
  plans: CropPlan[];
  onPlanClick?: (planId: string) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PLANNED: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800" },
  IN_PROGRESS: { bg: "bg-green-100", border: "border-green-300", text: "text-green-800" },
  COMPLETED: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-600" },
};

function getMonthIndex(date: Date | null): number | null {
  if (!date) return null;
  return date.getMonth();
}

export function PlantingCalendar({ plans, onPlanClick }: PlantingCalendarProps) {
  // Calculate the span of each plan across months
  function getPlanSpan(plan: CropPlan): { start: number; end: number } {
    const start = getMonthIndex(plan.plannedPlantDate) ?? 0;
    const end = getMonthIndex(plan.plannedHarvestDate) ?? start;
    return { start, end };
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Month headers */}
        <div className="grid grid-cols-12 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
          {MONTHS.map((month) => (
            <div
              key={month}
              className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-600"
            >
              {month}
            </div>
          ))}
        </div>

        {/* Plan rows */}
        <div className="border border-t-0 border-gray-200 rounded-b-lg bg-white">
          {plans.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No crop plans to display.
            </div>
          ) : (
            plans.map((plan) => {
              const span = getPlanSpan(plan);
              const colors = STATUS_COLORS[plan.status] ?? STATUS_COLORS.PLANNED;

              return (
                <div
                  key={plan.id}
                  className="grid grid-cols-12 gap-px bg-gray-100 border-b border-gray-100 last:border-0"
                >
                  {/* Plan label */}
                  <div
                    className="col-span-12 px-3 py-1.5 bg-white"
                    style={{
                      gridColumn: `1 / -1`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium text-gray-800 hover:text-green-600 hover:underline truncate max-w-[200px]"
                        onClick={() => onPlanClick?.(plan.id)}
                        title={plan.cropVariety}
                      >
                        {plan.cropVariety}
                      </button>
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}
                      >
                        {plan.status === "PLANNED"
                          ? "Planned"
                          : plan.status === "IN_PROGRESS"
                            ? "In Progress"
                            : "Completed"}
                      </span>
                    </div>

                    {/* Timeline bar */}
                    <div className="mt-1 grid grid-cols-12 gap-px">
                      {MONTHS.map((_, i) => {
                        const isActive = i >= span.start && i <= span.end;
                        const isPlantMonth = i === span.start;
                        const isHarvestMonth = i === span.end;
                        return (
                          <div
                            key={i}
                            className={`h-3 rounded-sm ${
                              isActive
                                ? `${colors.bg} ${colors.border} border`
                                : "bg-gray-50"
                            } ${isPlantMonth ? "rounded-l-sm" : ""} ${
                              isHarvestMonth ? "rounded-r-sm" : ""
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-6 rounded-sm bg-blue-100 border border-blue-300" />
            Planned
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-6 rounded-sm bg-green-100 border border-green-300" />
            In Progress
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-6 rounded-sm bg-gray-100 border border-gray-300" />
            Completed
          </div>
        </div>
      </div>
    </div>
  );
}