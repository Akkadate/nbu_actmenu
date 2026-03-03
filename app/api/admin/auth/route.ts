import { NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_auth";

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSKEY;
  if (!expected) {
    return NextResponse.json({ success: false, error: "Server not configured" }, { status: 500 });
  }

  const body = (await req.json()) as { passkey?: string };

  if (!body?.passkey || body.passkey !== expected) {
    return NextResponse.json({ success: false, error: "Invalid passkey" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}