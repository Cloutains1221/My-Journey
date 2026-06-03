import { r2PresignUpload } from "@/lib/r2";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value === "authenticated";
}

export async function POST(request: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { tripId, fileName, contentType } = await request.json();
  if (!tripId || !fileName || !contentType) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const key = `${tripId}/${fileName}`;
  const presignedUrl = await r2PresignUpload(key, contentType);
  return NextResponse.json({ presignedUrl, key, publicUrl: `${PUBLIC_URL}/${key}` });
}
