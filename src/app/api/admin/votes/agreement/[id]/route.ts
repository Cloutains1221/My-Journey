import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value === "authenticated";
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const { id } = await params;

  const { data: vote } = await supabaseAdmin
    .from("agreement_votes")
    .select("trip_id, trips(slug)")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin.from("agreement_votes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ((vote as any)?.trips?.slug) {
    revalidatePath(`/trip/${(vote as any).trips.slug}`);
  }

  return NextResponse.json({ success: true });
}
