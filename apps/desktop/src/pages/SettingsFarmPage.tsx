import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useAuth } from "../auth/AuthContext.js";

export function SettingsFarmPage() {
  const { user } = useAuth();

  const { data: farm } = useQuery({
    queryKey: ["farm", user?.farmId],
    queryFn: async () => {
      if (!user) return null;
      const db = await getDb();
      const [row] = await db
        .select()
        .from(farms)
        .where(eq(farms.id, user.farmId))
        .limit(1);
      return row;
    },
    enabled: !!user,
  });

  return (
    <DashboardShell title="Farm Settings">
      <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Farm Name</label>
            <p className="mt-1 text-sm text-gray-800">{farm?.name ?? "—"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Farm ID</label>
            <p className="mt-1 font-mono text-xs text-gray-500">{farm?.id ?? "—"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Country Profile</label>
            <p className="mt-1 text-sm text-gray-800">{farm?.countryProfile?.toUpperCase() ?? "—"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Created</label>
            <p className="mt-1 text-sm text-gray-800">
              {farm?.createdAt ? new Date(farm.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
