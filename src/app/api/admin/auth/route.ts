import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin_token", "authenticated", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "密码错误" }, { status: 401 });
}
