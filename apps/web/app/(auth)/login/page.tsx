"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField, Input, Button } from "@tpt/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Sign in</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} error={!!errors.email} />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} error={!!errors.password} />
          </FormField>

          {errors.root && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>
          )}

          <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          No account?{" "}
          <Link href="/register" className="font-medium text-green-600 hover:underline">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
