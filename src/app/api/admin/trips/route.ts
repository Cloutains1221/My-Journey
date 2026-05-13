import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value === "authenticated";
}

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select("*, photos(count)")
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("trips").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
