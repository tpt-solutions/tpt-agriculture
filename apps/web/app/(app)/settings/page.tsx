import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@tpt/core";
import { Layout, DashboardShell } from "@tpt/ui";
import type { SidebarLink } from "@tpt/ui";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
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

  const subscription = await db.subscription.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const navLinks: SidebarLink[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
  ];

  const indoorSqm = (subscription?.indoorSqm ?? {}) as Record<string, number>;

  return (
    <Layout links={navLinks} tenantName={tenant.name}>
      <DashboardShell title="Settings">
        <div className="max-w-xl space-y-8">

          {/* Farm details */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Farm details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="w-32 text-gray-500">Name</dt>
                <dd className="text-gray-900">{tenant.name}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-32 text-gray-500">Slug</dt>
                <dd className="font-mono text-gray-900">{tenant.slug}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-32 text-gray-500">Country profile</dt>
                <dd className="text-gray-900">{tenant.countryProfile.toUpperCase()}</dd>
              </div>
            </dl>
          </section>

          {/* Subscription */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Subscription</h2>
            {!subscription ? (
              <div>
                <p className="text-sm text-gray-500">No active subscription.</p>
                <a href="/onboarding" className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline">
                  Start your trial →
                </a>
              </div>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex gap-4">
                  <dt className="w-36 text-gray-500">Bundle</dt>
                  <dd className="text-gray-900">{subscription.bundleTier}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-36 text-gray-500">Status</dt>
                  <dd>
                    <span className={[
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      subscription.status === "ACTIVE" || subscription.status === "TRIALING"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800",
                    ].join(" ")}>
                      {subscription.status}
                    </span>
                  </dd>
                </div>
                {subscription.hectares && (
                  <div className="flex gap-4">
                    <dt className="w-36 text-gray-500">Outdoor area</dt>
                    <dd className="text-gray-900">{subscription.hectares} ha</dd>
                  </div>
                )}
                {Object.entries(indoorSqm).map(([moduleId, sqm]) => (
                  <div key={moduleId} className="flex gap-4">
                    <dt className="w-36 capitalize text-gray-500">{moduleId.replace(/-/g, " ")}</dt>
                    <dd className="text-gray-900">{sqm} m²</dd>
                  </div>
                ))}
                <div className="flex gap-4">
                  <dt className="w-36 text-gray-500">
                    {subscription.status === "TRIALING" ? "Trial ends" : "Renews"}
                  </dt>
                  <dd className="text-gray-900">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            )}
          </section>

        </div>
      </DashboardShell>
    </Layout>
  );
}
