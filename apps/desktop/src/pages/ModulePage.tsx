import { useParams } from "react-router";
import { DashboardShell } from "@tpt/ui";
import { MODULE_REGISTRY } from "@tpt/core";

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const meta = moduleId ? MODULE_REGISTRY[moduleId] : undefined;

  if (!meta) {
    return (
      <DashboardShell title="Module Not Found">
        <p className="text-sm text-gray-500">
          The module "{moduleId}" does not exist.
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={meta.name}>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">{meta.description}</p>
        <p className="mt-4 text-xs text-gray-400">
          Module UI coming soon — this is a placeholder.
        </p>
      </div>
    </DashboardShell>
  );
}
