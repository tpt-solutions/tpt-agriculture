// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { Outlet } from "react-router";
import { useFarm } from "../farm/FarmContext.js";
import { useSettings } from "../context/FarmSettingsContext.js";
import { Layout } from "@tpt/ui";
import type { SidebarLink } from "@tpt/ui";
import { NotificationBell } from "../notifications/NotificationBell.js";

const MODULE_NAV_LINKS: (SidebarLink & { moduleId: string })[] = [
  { moduleId: "field-management", label: "Field Management", href: "/modules/field-management" },
  { moduleId: "crop-planning", label: "Crop Planning", href: "/modules/crop-planning" },
  { moduleId: "harvest-tracking", label: "Harvest Tracking", href: "/modules/harvest-tracking" },
  { moduleId: "pest-spray-log", label: "Pest & Spray Log", href: "/modules/pest-spray-log" },
  { moduleId: "viticulture", label: "Viticulture", href: "/modules/viticulture" },
  { moduleId: "orchard", label: "Orchard", href: "/modules/orchard" },
  { moduleId: "vegetables", label: "Vegetables", href: "/modules/vegetables" },
  { moduleId: "microgreens", label: "Microgreens", href: "/modules/microgreens" },
  { moduleId: "protected-cropping", label: "Protected Cropping", href: "/modules/protected-cropping" },
  { moduleId: "aquaponics", label: "Aquaponics", href: "/modules/aquaponics" },
  { moduleId: "cattle-dairy", label: "Dairy Cattle", href: "/modules/cattle-dairy" },
  { moduleId: "cattle-beef", label: "Beef Cattle", href: "/modules/cattle-beef" },
  { moduleId: "sheep", label: "Sheep", href: "/modules/sheep" },
  { moduleId: "goats", label: "Goats", href: "/modules/goats" },
  { moduleId: "deer", label: "Deer", href: "/modules/deer" },
  { moduleId: "pigs", label: "Pigs", href: "/modules/pigs" },
  { moduleId: "poultry", label: "Poultry", href: "/modules/poultry" },
  { moduleId: "bees", label: "Beekeeping", href: "/modules/bees" },
  { moduleId: "pasture", label: "Pasture", href: "/modules/pasture" },
];

// Platform tools are always visible — not gated by the horticulture/livestock module picker.
const PLATFORM_NAV_LINKS: SidebarLink[] = [
  { label: "Financials", href: "/modules/financials" },
  { label: "Input Prices", href: "/modules/input-prices" },
  { label: "Output Prices", href: "/modules/output-prices" },
  { label: "Soil & Water", href: "/modules/soil-water" },
  { label: "Inventory", href: "/modules/inventory" },
  { label: "Equipment", href: "/modules/equipment" },
  { label: "Compliance", href: "/modules/compliance" },
  { label: "Staff", href: "/modules/staff" },
  { label: "Fertiliser Applications", href: "/modules/fertiliser-applications" },
  { label: "Livestock Traceability", href: "/modules/livestock-traceability" },
  { label: "Analytics", href: "/modules/analytics" },
  { label: "Reports", href: "/modules/reports" },
];

export function AppLayout() {
  const { farmName } = useFarm();
  const settings = useSettings();
  const enabledModuleIds = settings?.settings.enabledModuleIds as string[] | undefined;

  const visibleModuleLinks = enabledModuleIds
    ? MODULE_NAV_LINKS.filter((link) => enabledModuleIds.includes(link.moduleId))
    : MODULE_NAV_LINKS;

  const links: SidebarLink[] = [
    { label: "Dashboard", href: "/" },
    ...visibleModuleLinks,
    ...PLATFORM_NAV_LINKS,
    { label: "Settings", href: "/settings/farm" },
    { label: "Modules", href: "/settings/modules" },
    { label: "Notifications", href: "/settings/notifications" },
    { label: "Backup", href: "/settings/backup" },
    { label: "Restore", href: "/settings/restore" },
  ];

  return (
    <Layout links={links} tenantName={farmName}>
      <div className="mb-4 flex justify-end">
        <NotificationBell />
      </div>
      <Outlet />
    </Layout>
  );
}
