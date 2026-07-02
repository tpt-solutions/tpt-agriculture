// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDb, resolveCountryProfile } from "@tpt/core";
import type { CountryProfile } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useFarm } from "../farm/FarmContext.js";
import { resolveNotificationSettings } from "../notifications/reminder-sources.js";
import type { NotificationSettings } from "../notifications/reminder-sources.js";

interface FarmSettings {
  farmId: string;
  farmName: string;
  countryProfile: CountryProfile;
  settings: Record<string, unknown>;
  notifications: NotificationSettings;
  lat: number | null;
  lon: number | null;
}

const FarmSettingsContext = createContext<FarmSettings | null>(null);

export function FarmSettingsProvider({ children }: { children: React.ReactNode }) {
  const { farmId } = useFarm();

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
        notifications: resolveNotificationSettings(settings.notifications),
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