import { createServerClient } from "@supabase/ssr";
import type { Database } from "../database.types.js";

type CookieStore = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options: Record<string, unknown>): void;
};

/**
 * Creates a Supabase server client tied to the current request's cookie store.
 * Pass Next.js `cookies()` (from `next/headers`) as the cookie store.
 */
export function createServerSupabaseClient(cookieStore: CookieStore) {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Supabase URL/key env vars are missing");

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component; middleware handles refresh
        }
      },
    },
  });
}

/**
 * Creates a Supabase server client with the service-role key.
 * Use only in API route handlers for privileged operations (never expose to client).
 */
export function createAdminSupabaseClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Supabase URL/service-role key env vars are missing");

  return createServerClient<Database>(url, key, {
    cookies: { get: () => undefined, set: () => {}, remove: () => {} },
    auth: { persistSession: false },
  });
}
