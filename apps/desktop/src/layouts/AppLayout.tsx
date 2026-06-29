import { Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext.js";
import { logout } from "../auth/auth-service.js";
import { Layout } from "@tpt/ui";
import type { SidebarLink } from "@tpt/ui";

const NAV_LINKS: SidebarLink[] = [
  { label: "Dashboard", href: "/" },
  { label: "Field Management", href: "/modules/field-management" },
  { label: "Crop Planning", href: "/modules/crop-planning" },
  { label: "Harvest Tracking", href: "/modules/harvest-tracking" },
  { label: "Pest & Spray Log", href: "/modules/pest-spray-log" },
  { label: "Viticulture", href: "/modules/viticulture" },
  { label: "Orchard", href: "/modules/orchard" },
  { label: "Vegetables", href: "/modules/vegetables" },
  { label: "Microgreens", href: "/modules/microgreens" },
  { label: "Protected Cropping", href: "/modules/protected-cropping" },
  { label: "Aquaponics", href: "/modules/aquaponics" },
  { label: "Dairy Cattle", href: "/modules/cattle-dairy" },
  { label: "Beef Cattle", href: "/modules/cattle-beef" },
  { label: "Sheep", href: "/modules/sheep" },
  { label: "Goats", href: "/modules/goats" },
  { label: "Deer", href: "/modules/deer" },
  { label: "Pigs", href: "/modules/pigs" },
  { label: "Poultry", href: "/modules/poultry" },
  { label: "Beekeeping", href: "/modules/bees" },
  { label: "Pasture", href: "/modules/pasture" },
  { label: "Settings", href: "/settings/farm" },
];

export function AppLayout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate("/login", { replace: true });
  }

  const links: SidebarLink[] = [
    ...NAV_LINKS,
    { label: "Users", href: "/settings/users" },
  ];

  return (
    <Layout links={links} tenantName={user?.farmName ?? ""}>
      <div className="flex items-center justify-between pb-4">
        <div />
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
      <Outlet />
    </Layout>
  );
}
