// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery } from "@tanstack/react-query";
import { Button } from "@tpt/ui";
import { listAuditLog, type AuditDiff } from "../audit/audit-service.js";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};

function formatCellValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

/** Generic change-history viewer, embeddable against any record in any module
 * (see Phase 17's audit trail item), mirroring `AttachmentsPanel`'s pattern. */
export function AuditLogPanel({
  farmId,
  recordTable,
  recordId,
  onClose,
}: {
  farmId: string;
  recordTable: string;
  recordId: string;
  onClose: () => void;
}) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit-log", recordTable, recordId],
    queryFn: () => listAuditLog(farmId, recordTable, recordId),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Change History</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">No recorded changes.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const changes = entry.changes ? (JSON.parse(entry.changes) as AuditDiff[] | Record<string, unknown> | null) : null;
              return (
                <div key={entry.id} className="rounded-md border border-gray-200 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${ACTION_STYLES[entry.action] ?? "bg-gray-100 text-gray-700"}`}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt)).toLocaleString()}
                    </span>
                  </div>
                  {entry.action === "UPDATE" && Array.isArray(changes) && (
                    <ul className="space-y-0.5 text-xs text-gray-600">
                      {changes.map((diff) => (
                        <li key={diff.field}>
                          <span className="font-medium">{diff.field}</span>: {formatCellValue(diff.before)} → {formatCellValue(diff.after)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
