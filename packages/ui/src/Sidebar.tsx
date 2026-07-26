import React, { useState, useEffect } from "react";

export interface SidebarLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
  moduleId?: string;
}

export interface SidebarGroup {
  label: string;
  links: SidebarLink[];
}

interface Props {
  links: SidebarLink[];
  groups?: SidebarGroup[] | undefined;
  tenantName: string;
}

const STORAGE_KEY = "tpt-sidebar-collapsed";

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCollapsed(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function Sidebar({ links, groups, tenantName }: Props) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => loadCollapsed());

  useEffect(() => {
    saveCollapsed(collapsed);
  }, [collapsed]);

  function toggleGroup(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  // If groups are provided, render grouped collapsible sidebar.
  // Otherwise, fall back to the flat link list.
  if (groups && groups.length > 0) {
    return (
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center border-b border-gray-200 px-4">
          <span className="truncate text-sm font-semibold text-gray-800">{tenantName}</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {/* Top-level links (Dashboard, etc.) */}
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

          {/* Grouped sections */}
          {groups.map((group) => {
            const isCollapsed = !!collapsed[group.label];
            return (
              <div key={group.label} className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center gap-1 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className={`h-3 w-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {group.label}
                </button>
                {!isCollapsed &&
                  group.links.map((link) => {
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
              </div>
            );
          })}
        </nav>
      </aside>
    );
  }

  // Flat link list (original behaviour)
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
