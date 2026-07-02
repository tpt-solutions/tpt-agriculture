// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";

interface FarmState {
  farmId: string | null;
  farmName: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FarmContext = createContext<FarmState>({
  farmId: null,
  farmName: "",
  loading: true,
  refresh: async () => {},
});

export function useFarm() {
  return useContext(FarmContext);
}

async function loadFarm(): Promise<{ farmId: string; farmName: string } | null> {
  const db = await getDb();
  const [row] = await db.select().from(farms).limit(1);
  if (!row) return null;
  return { farmId: row.id, farmName: row.name };
}

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmName, setFarmName] = useState("");
  const [loading, setLoading] = useState(true);

  const apply = useCallback((current: { farmId: string; farmName: string } | null) => {
    setFarmId(current?.farmId ?? null);
    setFarmName(current?.farmName ?? "");
  }, []);

  const refresh = useCallback(async () => {
    apply(await loadFarm());
  }, [apply]);

  useEffect(() => {
    loadFarm()
      .then(apply)
      .finally(() => setLoading(false));
  }, [apply]);

  return (
    <FarmContext.Provider value={{ farmId, farmName, loading, refresh }}>
      {children}
    </FarmContext.Provider>
  );
}
