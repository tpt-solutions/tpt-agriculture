// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { FarmProvider } from "./farm/FarmContext.js";
import { RequireFarm } from "./farm/RequireFarm.js";
import { FarmSetupPage } from "./farm/FarmSetupPage.js";
import { FarmSettingsProvider } from "./context/FarmSettingsContext.js";
import { AppLayout } from "./layouts/AppLayout.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { SettingsFarmPage } from "./pages/SettingsFarmPage.js";
import { SettingsModulesPage } from "./pages/SettingsModulesPage.js";
import { SettingsNotificationsPage } from "./pages/SettingsNotificationsPage.js";
import { SettingsBackupPage } from "./pages/SettingsBackupPage.js";
import { SettingsRestorePage } from "./pages/SettingsRestorePage.js";
import { ModulePage } from "./pages/ModulePage.js";
import { WeatherPage } from "./pages/WeatherPage.js";
import { DecisionSupportPage } from "./pages/DecisionSupportPage.js";
import { ReportsPage } from "./pages/ReportsPage.js";
import { PwaInstallBanner } from "./components/PwaInstallBanner.js";
import { RecoveryPhrasePage } from "./backup/RecoveryPhrasePage.js";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FarmProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/setup" element={<FarmSetupPage />} />
            <Route path="/recovery-phrase" element={<RecoveryPhrasePage />} />
            <Route
              path="/"
              element={
                <RequireFarm>
                  <FarmSettingsProvider>
                    <AppLayout />
                  </FarmSettingsProvider>
                </RequireFarm>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="modules/weather" element={<WeatherPage />} />
              <Route path="modules/decision-support" element={<DecisionSupportPage />} />
              <Route path="modules/reports" element={<ReportsPage />} />
              <Route path="modules/:moduleId" element={<ModulePage />} />
              <Route path="settings/farm" element={<SettingsFarmPage />} />
              <Route path="settings/modules" element={<SettingsModulesPage />} />
              <Route path="settings/notifications" element={<SettingsNotificationsPage />} />
              <Route path="settings/backup" element={<SettingsBackupPage />} />
              <Route path="settings/restore" element={<SettingsRestorePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <PwaInstallBanner />
        <Toaster position="top-right" richColors closeButton />
      </FarmProvider>
    </QueryClientProvider>
  );
}
