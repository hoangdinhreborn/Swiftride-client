import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("swiftride_token");
  res.cookies.delete("swiftride_role");
  return res;
}
