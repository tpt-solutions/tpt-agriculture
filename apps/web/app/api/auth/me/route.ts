import { NextResponse } from "next/server";
import { db } from "@tpt/core";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const profile = await db.profile.findUnique({
    where: { id: user.id },
    include: {
      tenants: {
        include: { tenant: true },
        orderBy: { tenant: { createdAt: "asc" } },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
