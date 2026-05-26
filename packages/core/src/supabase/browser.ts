import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types.js";

let _client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Returns a singleton Supabase browser client.
 * Safe to call multiple times — returns the same instance.
 */
export function createBrowserSupabaseClient() {
  if (_client) return _client;

  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Supabase URL/key env vars are missing");

  _client = createBrowserClient<Database>(url, key);
  return _client;
}
