import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@tpt/core";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  tenantName: z.string().min(2).max(100),
  tenantSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  countryProfile: z.string().default("nz"),
});

export async function POST(request: Request) {
  const body = await request.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, tenantName, tenantSlug, countryProfile } = parsed.data;

  const supabaseAdmin = await createSupabaseAdminClient();

  // Check slug uniqueness before creating the Supabase auth user
  const existingTenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
  if (existingTenant) {
    return NextResponse.json({ error: "Farm account slug is already taken" }, { status: 409 });
  }

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Failed to create user" }, { status: 400 });
  }

  // Create Profile + Tenant + TenantUser in a single transaction
  await db.$transaction(async (tx) => {
    await tx.profile.create({ data: { id: authData.user!.id, name, email } });
    const tenant = await tx.tenant.create({ data: { name: tenantName, slug: tenantSlug, countryProfile } });
    await tx.tenantUser.create({ data: { tenantId: tenant.id, profileId: authData.user!.id, role: "OWNER" } });
    return tenant;
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
