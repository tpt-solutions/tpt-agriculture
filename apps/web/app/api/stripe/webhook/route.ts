import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, invalidateAccessCache } from "@tpt/core";
import type { BundleTier, SubscriptionStatus } from "@prisma/client";

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"]!);
const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"]!;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const tenantId = meta["tenantId"];
  const bundleTier = meta["bundleTier"] as BundleTier;
  const hectares = meta["hectares"] ? Number(meta["hectares"]) : null;
  const indoorSqm = meta["indoorSqm"] ? (JSON.parse(meta["indoorSqm"]) as Record<string, number>) : null;

  if (!tenantId || !bundleTier || !session.subscription) return;

  const stripeSubId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id;

  const sub = await stripe.subscriptions.retrieve(stripeSubId);

  await db.subscription.create({
    data: {
      tenantId,
      stripeSubscriptionId: stripeSubId,
      bundleTier,
      status: stripeStatusToEnum(sub.status),
      hectares,
      indoorSqm,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    },
  });

  invalidateAccessCache(tenantId);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const meta = sub.metadata ?? {};
  const tenantId = meta["tenantId"];
  const hectares = meta["hectares"] ? Number(meta["hectares"]) : undefined;
  const indoorSqm = meta["indoorSqm"] ? (JSON.parse(meta["indoorSqm"]) as Record<string, number>) : undefined;

  await db.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status: stripeStatusToEnum(sub.status),
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      ...(hectares !== undefined ? { hectares } : {}),
      ...(indoorSqm !== undefined ? { indoorSqm } : {}),
    },
  });

  if (tenantId) invalidateAccessCache(tenantId);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!existing) return;

  await db.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: { status: "CANCELLED" },
  });

  invalidateAccessCache(existing.tenantId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;
  if (!stripeSubId) return;

  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (!existing) return;

  await db.subscription.update({
    where: { stripeSubscriptionId: stripeSubId },
    data: { status: "PAST_DUE" },
  });

  invalidateAccessCache(existing.tenantId);
}

function stripeStatusToEnum(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
    trialing: "TRIALING",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELLED",
    unpaid: "UNPAID",
  };
  return map[status] ?? "PAST_DUE";
}
