import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "@/lib/auth/token";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("swiftride_token")?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const decoded = decodeJwt(token);
  if (!decoded || !decoded.sub) {
    return NextResponse.json({ user: null });
  }

  // Kiểm tra thời hạn token
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    const res = NextResponse.json({ user: null, expired: true });
    res.cookies.delete("swiftride_token");
    res.cookies.delete("swiftride_role");
    return res;
  }

  return NextResponse.json({
    user: {
      id: decoded.sub,
      role: decoded.role,
      name: `${decoded.role} #${decoded.sub.substring(0, 6)}`,
    },
  });
}
