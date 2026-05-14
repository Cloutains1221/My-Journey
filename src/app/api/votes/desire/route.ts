import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const { tripId, desireLevel, nickname, comment } = await request.json();
  if (!tripId || !desireLevel || !nickname) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("desire_votes").insert({
    trip_id: tripId,
    desire_level: desireLevel,
    nickname,
    comment: comment || null,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "你已经表达过想去程度了" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: trip } = await supabaseAdmin.from("trips").select("slug").eq("id", tripId).single();
  if (trip?.slug) revalidatePath(`/trip/${trip.slug}`);

  return NextResponse.json({ success: true });
}
