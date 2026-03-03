import { NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_auth";

export async function POST(req: Request) {
  const baseUrl = process.env.APP_BASE_URL || req.url;
  const response = NextResponse.redirect(new URL("/admin/login", baseUrl));
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
