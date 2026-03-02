import { NextResponse } from "next/server";

export function ok(data?: any) {
  return NextResponse.json({ success: true, ...(data ?? {}) });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}