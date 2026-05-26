import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "@tpt/core";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BundleTier } from "@prisma/client";

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"]!);

const schema = z.object({
  bundleTier: z.enum(["HORTICULTURE", "LIVESTOCK", "FULL"]),
  tenantId: z.string(),
  hectares: z.number().int().min(1).optional(),
  indoorSqm: z.record(z.number()).optional(),
});

// Map bundle tiers to Stripe recurring price IDs (set in env vars)
const BUNDLE_PRICE_IDS: Record<BundleTier, string> = {
  HORTICULTURE: process.env["STRIPE_PRICE_HORTICULTURE"]!,
  LIVESTOCK: process.env["STRIPE_PRICE_LIVESTOCK"]!,
  FULL: process.env["STRIPE_PRICE_FULL"]!,
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await request.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { bundleTier, tenantId, hectares, indoorSqm } = parsed.data;

  // Verify the user belongs to the tenant
  const membership = await db.tenantUser.findFirst({
    where: { tenantId, profileId: user.id, role: { in: ["OWNER", "ADMIN"] } },
    include: { tenant: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const priceId = BUNDLE_PRICE_IDS[bundleTier];
  if (!priceId) {
    return NextResponse.json({ error: `No price configured for bundle: ${bundleTier}` }, { status: 500 });
  }

  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: user.email,
    line_items: [
      // Setup fee — one-time
      {
        price_data: {
          currency: "nzd",
          product_data: { name: `TPT Agriculture Setup — ${bundleTier}` },
          unit_amount: Number(process.env["STRIPE_SETUP_FEE_CENTS"] ?? 29900),
        },
        quantity: 1,
      },
      // Annual subscription
      { price: priceId, quantity: hectares ?? 1 },
    ],
    subscription_data: {
      trial_period_days: 30,
      metadata: {
        tenantId,
        bundleTier,
        hectares: hectares?.toString() ?? "",
        indoorSqm: indoorSqm ? JSON.stringify(indoorSqm) : "",
      },
    },
    metadata: {
      tenantId,
      bundleTier,
      hectares: hectares?.toString() ?? "",
      indoorSqm: indoorSqm ? JSON.stringify(indoorSqm) : "",
    },
    success_url: `${appUrl}/onboarding?step=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/onboarding?step=billing&cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}
