import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value === "authenticated";
}

export async function POST(request: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const formData = await request.formData();
  const tripId = formData.get("tripId") as string;
  const files = formData.getAll("files") as File[];

  if (!tripId || files.length === 0) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const results = [];

  for (const file of files) {
    const fileName = `${tripId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("trip-photos")
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("trip-photos")
      .getPublicUrl(fileName);

    const { error: dbError } = await supabaseAdmin.from("photos").insert({
      trip_id: tripId,
      url: urlData.publicUrl,
      caption: null,
      sort_order: 0,
    });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    results.push(urlData.publicUrl);
  }

  return NextResponse.json({ urls: results });
}
