// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { Outlet } from "react-router";
import { useFarm } from "../farm/FarmContext.js";
import { useSettings } from "../context/FarmSettingsContext.js";
import { Layout } from "@tpt/ui";
import type { SidebarLink, SidebarGroup } from "@tpt/ui";
import { MODULE_REGISTRY } from "@tpt/core";
import type { ModuleCategory } from "@tpt/core";
import { NotificationBell } from "../notifications/NotificationBell.js";

// Build module nav links directly from MODULE_REGISTRY + enabled modules.
const MODULE_HREF: Record<string, string> = {};
for (const id of Object.keys(MODULE_REGISTRY)) {
  MODULE_HREF[id] = `/modules/${id}`;
}

const CATEGORY_ORDER: ModuleCategory[] = ["horticulture", "livestock", "platform"];
const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  horticulture: "Horticulture",
  livestock: "Livestock",
  platform: "Platform",
};

// Platform tools that are always visible (not gated by the module picker).
const ALWAYS_VISIBLE = new Set(["financials", "input-prices", "output-prices", "decision-support"]);

// Bottom links (settings / backup) are always shown.
const BOTTOM_LINKS: SidebarLink[] = [
  { label: "Settings", href: "/settings/farm" },
  { label: "Modules", href: "/settings/modules" },
  { label: "Notifications", href: "/settings/notifications" },
  { label: "Traceability", href: "/settings/traceability" },
  { label: "Backup", href: "/settings/backup" },
  { label: "Restore", href: "/settings/restore" },
];

export function AppLayout() {
  const { farmName } = useFarm();
  const settings = useSettings();
  const enabledModuleIds = (settings?.settings.enabledModuleIds as string[] | undefined) ?? [];

  // Derive sidebar groups from MODULE_REGISTRY, filtered by enabled modules.
  const groups: SidebarGroup[] = [];
  for (const category of CATEGORY_ORDER) {
    const links: SidebarLink[] = [];
    for (const [id, meta] of Object.entries(MODULE_REGISTRY)) {
      if (meta.category !== category) continue;
      if (!ALWAYS_VISIBLE.has(id) && enabledModuleIds.length > 0 && !enabledModuleIds.includes(id)) continue;
      links.push({ label: meta.name, href: MODULE_HREF[id] });
    }
    if (links.length > 0) {
      groups.push({ label: CATEGORY_LABELS[category], links });
    }
  }

  return (
    <Layout
      links={[
        { label: "Dashboard", href: "/" },
        { label: "Calendar", href: "/calendar" },
        { label: "Reports", href: "/reports" },
        { label: "Analytics", href: "/analytics" },
        ...BOTTOM_LINKS,
      ]}
      groups={groups}
      tenantName={farmName}
    >
      <div className="mb-4 flex justify-end">
        <NotificationBell />
      </div>
      <Outlet />
    </Layout>
  );
}