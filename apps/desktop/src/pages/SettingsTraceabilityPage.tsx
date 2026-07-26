// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery } from "@tanstack/react-query";
import { useFarm } from "../farm/FarmContext.js";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { getTraceabilityProvider, TRACEABILITY_PROVIDERS } from "@tpt/core";

export function SettingsTraceabilityPage() {
  const { farmId } = useFarm();

  const { data: farm } = useQuery({
    queryKey: ["farm", farmId],
    queryFn: async () => {
      if (!farmId) return null;
      const db = await getDb();
      const [f] = await db.select().from(farms).where(eq(farms.id, farmId)).limit(1);
      return f;
    },
    enabled: !!farmId,
  });

  const countryProfile = farm?.countryProfile ?? "nz";
  const provider = getTraceabilityProvider(countryProfile);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Livestock Traceability</h1>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Country Profile</h2>
        <p className="text-sm text-gray-600">
          Your farm is set to: <span className="font-medium">{countryProfile.toUpperCase()}</span>
        </p>
        {provider && (
          <p className="mt-1 text-sm text-gray-500">
            Default traceability provider: <span className="font-medium">{provider.label}</span>
          </p>
        )}
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Available Traceability Providers</h2>
        <p className="mb-3 text-sm text-gray-500">
          Select the livestock traceability system for your region. This enables integration with
          official animal identification registries.
        </p>

        <div className="space-y-2">
          {(Object.values(TRACEABILITY_PROVIDERS) as Array<{
            id: string;
            label: string;
            description: string;
            formatPattern?: string;
          }>).map((p) => (
            <div key={p.id} className="flex items-start gap-3">
              <div>
                <div className="font-medium text-gray-700">{p.label}</div>
                <div className="text-xs text-gray-500">{p.description}</div>
                {p.formatPattern && (
                  <div className="text-xs text-gray-400">Format: {p.formatPattern}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Traceability Features</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Animal ID format validation
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Registry lookup links (where available)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Movement history tracking
          </li>
          <li className="flex items-center gap-2">
            <span className="text-gray-400">○</span>
            API integration (future)
          </li>
        </ul>
      </div>
    </div>
  );
}