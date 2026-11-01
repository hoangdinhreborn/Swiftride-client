import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "@/lib/auth/token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bảo vệ trang Rider: Ưu tiên cookie của Rider để không bị ghi đè khi tab khác đăng nhập Driver
  if (pathname.startsWith("/rider")) {
    const token =
      req.cookies.get("swiftride_rider_token")?.value ||
      req.cookies.get("swiftride_token")?.value;
    const decoded = token ? decodeJwt(token) : null;
    const isTokenValid = !!(decoded && decoded.sub && (!decoded.exp || decoded.exp * 1000 > Date.now()));

    if (!isTokenValid || decoded?.role !== "Rider") {
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("role", "Rider");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Bảo vệ trang Driver: Ưu tiên cookie của Driver
  if (pathname.startsWith("/driver")) {
    const token =
      req.cookies.get("swiftride_driver_token")?.value ||
      req.cookies.get("swiftride_token")?.value;
    const decoded = token ? decodeJwt(token) : null;
    const isTokenValid = !!(decoded && decoded.sub && (!decoded.exp || decoded.exp * 1000 > Date.now()));

    if (!isTokenValid || decoded?.role !== "Driver") {
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("role", "Driver");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Nếu vào trang chủ / hoặc /login
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/rider/:path*", "/driver/:path*", "/login"],
};
