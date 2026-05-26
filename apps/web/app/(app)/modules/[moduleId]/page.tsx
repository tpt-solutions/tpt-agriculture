import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, assertModuleAccess, MODULE_REGISTRY, getAccessibleModules } from "@tpt/core";
import { Layout, DashboardShell } from "@tpt/ui";
import type { SidebarLink } from "@tpt/ui";

interface Props {
  params: Promise<{ moduleId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { moduleId } = await params;
  const meta = MODULE_REGISTRY[moduleId];
  return { title: meta?.name ?? moduleId };
}

export default async function ModulePage({ params }: Props) {
  const { moduleId } = await params;

  const meta = MODULE_REGISTRY[moduleId];
  if (!meta) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tenantUser = await db.tenantUser.findFirst({
    where: { profileId: user.id },
    include: { tenant: true },
    orderBy: { tenant: { createdAt: "asc" } },
  });
  if (!tenantUser) redirect("/onboarding");

  const { tenant } = tenantUser;

  try {
    await assertModuleAccess(moduleId, tenant.id);
  } catch {
    redirect("/upgrade");
  }

  const moduleIds = await getAccessibleModules(tenant.id);
  const navLinks: SidebarLink[] = [
    { label: "Dashboard", href: "/dashboard" },
    ...moduleIds.map((id) => ({
      label: MODULE_REGISTRY[id]?.name ?? id,
      href: `/modules/${id}`,
      moduleId: id,
    })),
    { label: "Settings", href: "/settings" },
  ];

  return (
    <Layout links={navLinks} tenantName={tenant.name}>
      <DashboardShell title={meta.name}>
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-400">
          <p className="font-semibold text-gray-700">{meta.name}</p>
          <p className="mt-2 text-sm">{meta.description}</p>
          <p className="mt-4 text-xs text-gray-400">Module UI coming soon.</p>
        </div>
      </DashboardShell>
    </Layout>
  );
}
