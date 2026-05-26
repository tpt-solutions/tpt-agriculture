import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, getAccessibleModules, MODULE_REGISTRY } from "@tpt/core";
import { Layout, DashboardShell } from "@tpt/ui";
import type { SidebarLink } from "@tpt/ui";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
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
  const moduleIds = await getAccessibleModules(tenant.id);

  const subscription = await db.subscription.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const navLinks: SidebarLink[] = [
    { label: "Dashboard", href: "/dashboard" },
    ...moduleIds.map((id) => ({
      label: MODULE_REGISTRY[id]?.name ?? id,
      href: `/modules/${id}`,
      moduleId: id,
    })),
    { label: "Settings", href: "/settings" },
  ];

  const isTrialing = subscription?.status === "TRIALING";
  const trialEnd = subscription?.trialEnd;

  return (
    <Layout links={navLinks} tenantName={tenant.name}>
      <DashboardShell title="Dashboard">
        {isTrialing && trialEnd && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your 30-day free trial ends on{" "}
            <strong>{new Date(trialEnd).toLocaleDateString()}</strong>. Add a payment method to keep access.
          </div>
        )}

        {moduleIds.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <p className="font-medium">No modules active</p>
            <p className="mt-1 text-sm">
              <a href="/onboarding" className="text-green-600 hover:underline">Start your trial</a> to activate modules.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moduleIds.map((id) => {
              const meta = MODULE_REGISTRY[id];
              return (
                <a
                  key={id}
                  href={`/modules/${id}`}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="font-semibold text-gray-900">{meta?.name ?? id}</p>
                  <p className="mt-1 text-sm text-gray-500">{meta?.description}</p>
                </a>
              );
            })}
          </div>
        )}
      </DashboardShell>
    </Layout>
  );
}
