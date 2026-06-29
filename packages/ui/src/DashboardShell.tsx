import type { ReactNode } from "react";

interface Props {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ title, actions, children }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
