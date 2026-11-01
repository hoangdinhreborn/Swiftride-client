import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "@/lib/auth/token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("swiftride_token")?.value;
  const decoded = token ? decodeJwt(token) : null;
  const isTokenValid = !!(decoded && decoded.sub && (!decoded.exp || decoded.exp * 1000 > Date.now()));

  // 1. Bảo vệ trang Rider
  if (pathname.startsWith("/rider")) {
    if (!isTokenValid || decoded?.role !== "Rider") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("role", "Rider");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Bảo vệ trang Driver
  if (pathname.startsWith("/driver")) {
    if (!isTokenValid || decoded?.role !== "Driver") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("role", "Driver");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Nếu đã đăng nhập mà vào lại trang /login
  if (pathname === "/login") {
    if (isTokenValid) {
      const target = decoded?.role === "Driver" ? "/driver" : "/rider";
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/rider/:path*", "/driver/:path*", "/login"],
};
