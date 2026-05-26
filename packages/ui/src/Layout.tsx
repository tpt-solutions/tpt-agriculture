import React from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar.js";
import type { SidebarLink } from "./Sidebar.js";

interface Props {
  children: ReactNode;
  links: SidebarLink[];
  tenantName: string;
}

export function Layout({ children, links, tenantName }: Props) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar links={links} tenantName={tenantName} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
