import React from "react";

export interface SidebarLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
  moduleId?: string;
}

interface Props {
  links: SidebarLink[];
  tenantName: string;
}

export function Sidebar({ links, tenantName }: Props) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="truncate text-sm font-semibold text-gray-800">{tenantName}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <a
              key={link.href}
              href={link.href}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")}
            >
              {link.icon && <span className="h-4 w-4 shrink-0">{link.icon}</span>}
              {link.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
