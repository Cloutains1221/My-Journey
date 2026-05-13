import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value === "authenticated";
}

function generateSlug(title: string, date?: string): string {
  const ascii = title
    .replace(/[^\x00-\x7F]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  if (ascii.length >= 2) return ascii;
  if (date) return `trip-${date}`;
  return `trip-${Date.now()}`;
}

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select("*")
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const body = await request.json();
  const { title, slug: customSlug, date, location, latitude, longitude, cover_image, content, rating } = body;
  const slug = customSlug || generateSlug(title || "", date);
  const { data, error } = await supabaseAdmin.from("trips").insert({
    title, slug, date, location, latitude, longitude, cover_image, content, rating
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
