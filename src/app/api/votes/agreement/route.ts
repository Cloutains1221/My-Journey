import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { tripId, agreement, nickname, comment } = await request.json();
  if (!tripId || !agreement || !nickname) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("agreement_votes").insert({
    trip_id: tripId,
    agreement,
    nickname,
    comment: comment || null,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "你已经评价过这个地方了" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
