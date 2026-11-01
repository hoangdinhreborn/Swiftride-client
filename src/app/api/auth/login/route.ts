import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "@/lib/auth/token";
import type { LoginRequest, UserRole } from "@/types/auth";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:5000";
const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || "http://localhost:5130";
const MATCHING_SERVICE_URL = process.env.MATCHING_SERVICE_URL || "http://localhost:5197";

export async function POST(req: NextRequest) {
  try {
    const body: LoginRequest = await req.json();
    const role: UserRole = body.role || "Rider";
    const payload = {
      role,
      userId: body.userId || undefined,
    };

    // Thử lấy token qua API Gateway trước, nếu gateway chưa bật thì fallback sang TripService / MatchingService
    const targetUrls = [
      `${GATEWAY_URL}/dev/token`,
      `${TRIP_SERVICE_URL}/dev/token`,
      `${MATCHING_SERVICE_URL}/dev/token`,
    ];

    let tokenText = "";
    let lastError: unknown = null;

    for (const url of targetUrls) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          tokenText = await res.text();
          if (tokenText.trim()) break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!tokenText.trim()) {
      return NextResponse.json(
        {
          error: "Không thể kết nối đến Backend Gateway (cổng 5000) hoặc Services.",
          detail: String(lastError || "Tất cả endpoints /dev/token đều không phản hồi"),
        },
        { status: 503 }
      );
    }

    const cleanToken = tokenText.trim().replace(/^"|"$/g, "");
    const decoded = decodeJwt(cleanToken);

    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { error: "Token nhận được từ Backend không hợp lệ" },
        { status: 500 }
      );
    }

    const user = {
      id: decoded.sub,
      role: decoded.role,
      name: `${decoded.role} #${decoded.sub.substring(0, 6)}`,
    };

    const response = NextResponse.json({
      ok: true,
      user,
    });

    // Thiết lập HttpOnly Cookie an toàn
    response.cookies.set("swiftride_token", cleanToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7200, // 2 giờ
    });

    response.cookies.set("swiftride_role", decoded.role, {
      httpOnly: false, // cho phép client đọc role nhanh để hiển thị avatar
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7200,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi xử lý đăng nhập", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
