"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField, Input, Button } from "@tpt/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    tenantName: z.string().min(2, "Farm name must be at least 2 characters"),
    tenantSlug: z
      .string()
      .min(2)
      .max(60)
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    // 1. Create profile + tenant in our DB
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError("root", { message: body.error ?? "Registration failed" });
      return;
    }

    // 2. Sign in with Supabase Auth
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError("root", { message: error.message });
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Start your free trial</h1>
        <p className="mb-6 text-sm text-gray-500">30 days free — no card required</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Your name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" {...register("name")} error={!!errors.name} />
          </FormField>

          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} error={!!errors.email} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} error={!!errors.password} />
            </FormField>
            <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} error={!!errors.confirmPassword} />
            </FormField>
          </div>

          <hr className="border-gray-100" />

          <FormField label="Farm / business name" htmlFor="tenantName" error={errors.tenantName?.message}>
            <Input id="tenantName" {...register("tenantName")} error={!!errors.tenantName} />
          </FormField>

          <FormField
            label="Account URL slug"
            htmlFor="tenantSlug"
            hint="Lowercase letters, numbers and hyphens only"
            error={errors.tenantSlug?.message}
          >
            <Input id="tenantSlug" placeholder="my-farm" {...register("tenantSlug")} error={!!errors.tenantSlug} />
          </FormField>

          {errors.root && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>
          )}

          <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
