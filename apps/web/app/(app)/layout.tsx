import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@tpt/core";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ensure profile exists
  const profile = await db.profile.findUnique({ where: { id: user.id } });
  if (!profile) redirect("/login");

  return <>{children}</>;
}
