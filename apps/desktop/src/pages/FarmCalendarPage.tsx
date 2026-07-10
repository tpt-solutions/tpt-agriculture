// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { getDb } from "@tpt/core";
import { farmTasks, taskTemplates } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useFarm } from "../farm/FarmContext.js";
import { getFarmCalendarEvents, type CalendarEvent } from "../calendar/get-farm-calendar-events.js";
import { useCountryProfile } from "../context/FarmSettingsContext.js";
import { toast } from "sonner";

type ViewMode = "month" | "week";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MODULE_COLORS: Record<string, string> = {
  "crop-planning": "bg-blue-100 text-blue-700 border-blue-200",
  "harvest-tracking": "bg-green-100 text-green-700 border-green-200",
  "pest-spray-log": "bg-amber-100 text-amber-700 border-amber-200",
  equipment: "bg-gray-100 text-gray-700 border-gray-200",
  compliance: "bg-red-100 text-red-700 border-red-200",
  "soil-water": "bg-purple-100 text-purple-700 border-purple-200",
  tasks: "bg-indigo-100 text-indigo-700 border-indigo-200",
  default: "bg-gray-100 text-gray-600 border-gray-200",
};

function getColor(moduleId: string): string {
  return MODULE_COLORS[moduleId] ?? MODULE_COLORS.default;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-start
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function FarmCalendarPage() {
  const { farmId } = useFarm();
  const countryProfile = useCountryProfile();
  const locale = countryProfile?.locale;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTaskType, setNewTaskType] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Fetch module calendar events via dateFields scanner
  const { data: moduleEvents = [] } = useQuery({
    queryKey: ["calendar-events", farmId],
    queryFn: () => getFarmCalendarEvents(farmId ?? "", locale),
    enabled: !!farmId,
  });

  // Fetch farm tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["farm-tasks", farmId],
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!farmId) return [];
      const db = await getDb();
      const rows = await db.select().from(farmTasks).where(eq(farmTasks.farmId, farmId));
      return rows
        .filter((r) => r.dueDate != null)
        .map((r) => ({
          id: `task.${r.id}`,
          moduleId: "tasks",
          moduleLabel: "Task",
          date: r.dueDate instanceof Date ? r.dueDate : r.dueDate ? new Date(r.dueDate) : new Date(),
          label: r.title ?? r.taskType ?? "Task",
          path: "/modules/tasks",
          recordId: r.id,
        }));
    },
    enabled: !!farmId,
  });

  // Fetch task templates for the add form
  const { data: templates = [] } = useQuery({
    queryKey: ["task-templates", farmId],
    queryFn: async () => {
      if (!farmId) return [];
      const db = await getDb();
      return db.select().from(taskTemplates).where(eq(taskTemplates.farmId, farmId));
    },
    enabled: !!farmId,
  });

  const allEvents = useMemo(() => [...moduleEvents, ...tasks], [moduleEvents, tasks]);

  // Build calendar grid
  const calendarStart = viewMode === "month"
    ? startOfWeek(startOfMonth(currentDate))
    : startOfWeek(currentDate);

  const totalDays = viewMode === "month" ? 42 : 7;
  const calendarDays = useMemo(() => {
    const days: { date: Date; events: CalendarEvent[]; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(calendarStart, i);
      const dayEvents = allEvents.filter((ev) => sameDay(ev.date, date));
      days.push({ date, events: dayEvents, isCurrentMonth: date.getMonth() === currentDate.getMonth() });
    }
    return days;
  }, [calendarStart, totalDays, allEvents, currentDate]);

  function prevPeriod() {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function nextPeriod() {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  async function handleAddTask() {
    if (!farmId || !newTaskType.trim()) return;
    const db = await getDb();
    await db.insert(farmTasks).values({
      farmId,
      taskType: newTaskType,
      title: newTaskTitle || newTaskType,
      dueDate: new Date(newTaskDate),
      status: "PENDING",
    });
    setShowAddTask(false);
    setNewTaskType("");
    setNewTaskTitle("");
    queryClient.invalidateQueries({ queryKey: ["farm-tasks", farmId] });
    toast.success("Task added");
  }

  const headerLabel = viewMode === "month"
    ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `Week of ${calendarStart.toLocaleDateString()}`;

  return (
    <DashboardShell
      title="Farm Calendar"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === "month" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === "week" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Week
            </button>
          </div>
          <Button variant="secondary" onClick={goToday}>Today</Button>
          <Button onClick={() => setShowAddTask(true)}>+ Add Task</Button>
        </div>
      }
    >
      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevPeriod} className="rounded p-1 hover:bg-gray-100">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-700">{headerLabel}</h2>
          <button type="button" onClick={nextPeriod} className="rounded p-1 hover:bg-gray-100">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <span className="text-xs text-gray-400">{allEvents.length} event{allEvents.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Add Task</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Task Type</label>
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select type...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.taskType}>{t.taskType}</option>
                ))}
                <option value="custom">Custom task...</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task description"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Due Date</label>
              <input
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleAddTask} disabled={!newTaskType.trim()}>Add Task</Button>
            <Button variant="secondary" onClick={() => setShowAddTask(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {/* Day headers */}
        <div className={`grid ${viewMode === "month" ? "grid-cols-7" : "grid-cols-7"} border-b border-gray-200`}>
          {DAY_NAMES.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className={`grid ${viewMode === "month" ? "grid-cols-7" : "grid-cols-7"}`}>
          {calendarDays.map((day, i) => {
            const isToday = sameDay(day.date, new Date());
            return (
              <div
                key={i}
                className={`min-h-[80px] border-b border-r border-gray-100 p-1.5 ${
                  !day.isCurrentMonth ? "bg-gray-50/50" : ""
                } ${isToday ? "bg-green-50/30" : ""}`}
              >
                <div className={`mb-1 text-xs font-medium ${isToday ? "text-green-700" : day.isCurrentMonth ? "text-gray-700" : "text-gray-400"}`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {day.events.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => navigate(ev.path)}
                      className={`block w-full truncate rounded border px-1.5 py-0.5 text-[10px] font-medium text-left transition-colors hover:opacity-80 ${getColor(ev.moduleId)}`}
                      title={`${ev.moduleLabel}: ${ev.label}`}
                    >
                      {ev.label}
                    </button>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-[10px] text-gray-400">+{day.events.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(MODULE_COLORS).filter(([k]) => k !== "default").map(([id, cls]) => {
          const count = allEvents.filter((e) => e.moduleId === id).length;
          if (count === 0) return null;
          return (
            <span key={id} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
              {id.replace(/-/g, " ")} ({count})
            </span>
          );
        })}
      </div>
    </DashboardShell>
  );
}
