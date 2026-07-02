// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useFarm } from "./FarmContext.js";

export function RequireFarm({ children }: { children: ReactNode }) {
  const { farmId, loading } = useFarm();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  if (!farmId) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
