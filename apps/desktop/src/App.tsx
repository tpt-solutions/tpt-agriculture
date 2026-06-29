import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, RequireAuth } from "./auth/index.js";
import { LoginPage } from "./auth/LoginPage.js";
import { SetupPage } from "./auth/SetupPage.js";
import { AppLayout } from "./layouts/AppLayout.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { SettingsUsersPage } from "./pages/SettingsUsersPage.js";
import { SettingsFarmPage } from "./pages/SettingsFarmPage.js";
import { ModulePage } from "./pages/ModulePage.js";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="modules/:moduleId" element={<ModulePage />} />
              <Route path="settings/users" element={<SettingsUsersPage />} />
              <Route path="settings/farm" element={<SettingsFarmPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
