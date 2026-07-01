// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useAuth } from "../auth/AuthContext.js";

interface FarmSettings {
  farmId: string;
  farmName: string;
  countryProfile: {
    id: string;
    label: string;
    locale: string;
    dateFormat: string;
    units: {
      area: "ha";
      weight: "kg";
      volume: "L";
      temperature: "°C";
      speed: "kph";
    };
    regulatory: {
      chemicalRegNumber: string;
    };
    weatherProviders: readonly string[];
  };
  settings: Record<string, unknown>;
  lat: number | null;
  lon: number | null;
}

const FarmSettingsContext = createContext<FarmSettings | null>(null);

// Simple country profile resolution inline (will be replaced with full implementation)
const COUNTRY_PROFILES: Record<string, FarmSettings["countryProfile"]> = {
  nz: {
    id: "nz",
    label: "New Zealand",
    locale: "en-NZ",
    dateFormat: "dd/MM/yyyy",
    units: { area: "ha", weight: "kg", volume: "L", temperature: "°C", speed: "kph" },
    regulatory: { chemicalRegNumber: "ACVM Number" },
    weatherProviders: ["open-meteo", "custom"] as const,
  },
};

const resolveCountryProfile = (id: string | null | undefined) =>
  COUNTRY_PROFILES[id ?? "nz"] ?? COUNTRY_PROFILES.nz;

export function FarmSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const farmId = user?.farmId;

  const { data: farmData } = useQuery({
    queryKey: ["farm-settings", farmId],
    queryFn: async () => {
      if (!farmId) return null;
      const db = await getDb();
      const [farm] = await db.select().from(farms).where(eq(farms.id, farmId)).limit(1);
      if (!farm) return null;

      const profile = resolveCountryProfile(farm.countryProfile);
      const settings = farm.settingsJson ?? {};

      return {
        farmId: farm.id,
        farmName: farm.name,
        countryProfile: profile,
        settings,
        lat: farm.lat,
        lon: farm.lon,
      };
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <FarmSettingsContext.Provider value={farmData ?? null}>
      {children}
    </FarmSettingsContext.Provider>
  );
}

export function useSettings(): FarmSettings | null {
  return useContext(FarmSettingsContext);
}

export function useCountryProfile() {
  const settings = useContext(FarmSettingsContext);
  return settings?.countryProfile ?? null;
}