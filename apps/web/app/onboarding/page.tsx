"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, Input, Select, Button } from "@tpt/ui";
import { MODULE_REGISTRY, BUNDLE_MODULES } from "@tpt/core";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "country" | "bundle" | "size" | "billing" | "done";
type BundleTier = "HORTICULTURE" | "LIVESTOCK" | "FULL";

const STEPS: Step[] = ["country", "bundle", "size", "billing", "done"];

const COUNTRY_OPTIONS = [
  { value: "nz", label: "New Zealand" },
  { value: "au", label: "Australia" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
];

// ─── Step 1: Country ─────────────────────────────────────────────────────────

const countrySchema = z.object({ countryProfile: z.string() });
type CountryForm = z.infer<typeof countrySchema>;

function CountryStep({ onNext }: { onNext: (v: CountryForm) => void }) {
  const { register, handleSubmit } = useForm<CountryForm>({
    resolver: zodResolver(countrySchema),
    defaultValues: { countryProfile: "nz" },
  });
  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Where is your farm?</h2>
        <p className="mt-1 text-sm text-gray-500">Sets default units, currency and compliance fields.</p>
      </div>
      <FormField label="Country" htmlFor="countryProfile">
        <Select id="countryProfile" options={COUNTRY_OPTIONS} {...register("countryProfile")} />
      </FormField>
      <Button type="submit">Next</Button>
    </form>
  );
}

// ─── Step 2: Bundle ───────────────────────────────────────────────────────────

function BundleStep({ onNext }: { onNext: (tier: BundleTier) => void }) {
  const bundles: { tier: BundleTier; name: string; description: string }[] = [
    { tier: "HORTICULTURE", name: "Horticulture", description: "Cropping, viticulture, orchards, vegetables, microgreens, aquaponics, protected cropping" },
    { tier: "LIVESTOCK", name: "Livestock", description: "Cattle, sheep, goats, deer, pigs, poultry, bees, pasture management" },
    { tier: "FULL", name: "Full Platform", description: "All modules including financials, inventory, equipment, weather, compliance and staff" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">What do you farm?</h2>
        <p className="mt-1 text-sm text-gray-500">Choose the module bundle that fits your operation.</p>
      </div>
      <div className="flex flex-col gap-3">
        {bundles.map((b) => (
          <button
            key={b.tier}
            onClick={() => onNext(b.tier)}
            className="rounded-lg border-2 border-gray-200 p-4 text-left transition-colors hover:border-green-500 hover:bg-green-50"
          >
            <p className="font-semibold text-gray-900">{b.name}</p>
            <p className="mt-0.5 text-sm text-gray-500">{b.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Farm size ────────────────────────────────────────────────────────

const INDOOR_MODULE_IDS = ["microgreens", "protected-cropping", "aquaponics"];

function SizeStep({ bundleTier, onNext }: { bundleTier: BundleTier; onNext: (size: SizeData) => void }) {
  const modules = BUNDLE_MODULES[bundleTier] ?? [];
  const hasOutdoor = modules.some((m) => !INDOOR_MODULE_IDS.includes(m));
  const indoorModules = modules.filter((m) => INDOOR_MODULE_IDS.includes(m));

  const fields: Record<string, string> = {};
  if (hasOutdoor) fields["hectares"] = "Total outdoor hectares";
  for (const m of indoorModules) {
    fields[m] = `${MODULE_REGISTRY[m]?.name ?? m} area (m²)`;
  }

  const schemaShape: Record<string, z.ZodType> = {};
  for (const key of Object.keys(fields)) {
    schemaShape[key] = z.coerce.number().int().min(1);
  }
  const sizeSchema = z.object(schemaShape as Record<string, z.ZodNumber>);
  type SizeForm = z.infer<typeof sizeSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<SizeForm>({
    resolver: zodResolver(sizeSchema),
  });

  const onSubmit = (data: SizeForm) => {
    const hectares = "hectares" in data ? Number(data["hectares"]) : undefined;
    const indoorSqm: Record<string, number> = {};
    for (const m of indoorModules) {
      if (m in data) indoorSqm[m] = Number(data[m as keyof SizeForm]);
    }
    onNext({ hectares, indoorSqm: Object.keys(indoorSqm).length ? indoorSqm : undefined });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">How big is your operation?</h2>
        <p className="mt-1 text-sm text-gray-500">Used to calculate your subscription. You can add more later.</p>
      </div>
      <div className="flex flex-col gap-4">
        {Object.entries(fields).map(([key, label]) => (
          <FormField key={key} label={label} htmlFor={key} error={(errors[key as keyof SizeForm] as { message?: string } | undefined)?.message}>
            <Input id={key} type="number" min={1} {...register(key as keyof SizeForm)} error={!!errors[key as keyof SizeForm]} />
          </FormField>
        ))}
      </div>
      <Button type="submit">Continue to checkout</Button>
    </form>
  );
}

export interface SizeData {
  hectares?: number;
  indoorSqm?: Record<string, number>;
}

// ─── Step 4: Billing ─────────────────────────────────────────────────────────

function BillingStep({ bundleTier, size, tenantId }: { bundleTier: BundleTier; size: SizeData; tenantId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleTier, tenantId, ...size }),
      });
      const body = await res.json() as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Failed to create checkout session");
      window.location.href = body.url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Start your subscription</h2>
        <p className="mt-1 text-sm text-gray-500">
          Billed annually. Your 30-day free trial starts now — no charge until the trial ends.
        </p>
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button onClick={startCheckout} loading={loading}>
        Continue to payment
      </Button>
    </div>
  );
}

// ─── Step 5: Done ─────────────────────────────────────────────────────────────

function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">You&apos;re all set!</h2>
        <p className="mt-1 text-sm text-gray-500">Your farm account is ready. Your 30-day trial is active.</p>
      </div>
      <Button onClick={onFinish}>Go to dashboard</Button>
    </div>
  );
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDone = searchParams.get("step") === "done";

  const [step, setStep] = useState<Step>(isDone ? "done" : "country");
  const [countryProfile, setCountryProfile] = useState("nz");
  const [bundleTier, setBundleTier] = useState<BundleTier>("FULL");
  const [size, setSize] = useState<SizeData>({});

  // TODO: replace with actual tenantId from session
  const tenantId = searchParams.get("tenantId") ?? "";

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={[
                "h-2 flex-1 rounded-full transition-colors",
                i <= stepIndex ? "bg-green-500" : "bg-gray-200",
              ].join(" ")}
            />
          ))}
        </div>

        {step === "country" && (
          <CountryStep onNext={(v) => { setCountryProfile(v.countryProfile); setStep("bundle"); }} />
        )}
        {step === "bundle" && (
          <BundleStep onNext={(tier) => { setBundleTier(tier); setStep("size"); }} />
        )}
        {step === "size" && (
          <SizeStep bundleTier={bundleTier} onNext={(s) => { setSize(s); setStep("billing"); }} />
        )}
        {step === "billing" && (
          <BillingStep bundleTier={bundleTier} size={size} tenantId={tenantId} />
        )}
        {step === "done" && <DoneStep onFinish={() => router.push("/dashboard")} />}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
