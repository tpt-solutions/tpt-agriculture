import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar.js";
import type { SidebarLink, SidebarGroup } from "./Sidebar.js";

interface Props {
  children: ReactNode;
  links: SidebarLink[];
  groups?: SidebarGroup[] | undefined;
  tenantName: string;
}

export function Layout({ children, links, groups, tenantName }: Props) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar links={links} groups={groups} tenantName={tenantName} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
