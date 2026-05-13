import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value === "authenticated";
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { error } = await supabaseAdmin.from("trips").update(body).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("trips").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
