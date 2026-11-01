import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:5000";
const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || "http://localhost:5130";
const MATCHING_SERVICE_URL = process.env.MATCHING_SERVICE_URL || "http://localhost:5197";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:5273";

function resolveTargetUrl(pathStr: string): string[] {
  // Trả về mảng URL ưu tiên: 1. Qua Gateway, 2. Fallback trực tiếp service nếu gateway chưa bật
  const gatewayTarget = `${GATEWAY_URL}/${pathStr}`;
  let directTarget = "";

  if (pathStr.startsWith("trips")) {
    directTarget = `${TRIP_SERVICE_URL}/${pathStr}`;
  } else if (pathStr === "quote" || pathStr === "match" || pathStr.startsWith("drivers")) {
    directTarget = `${MATCHING_SERVICE_URL}/${pathStr}`;
  } else if (pathStr.startsWith("payments")) {
    directTarget = `${PAYMENT_SERVICE_URL}/${pathStr}`;
  }

  return directTarget ? [gatewayTarget, directTarget] : [gatewayTarget];
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");
  const searchParams = req.nextUrl.searchParams.toString();
  const fullPath = searchParams ? `${pathStr}?${searchParams}` : pathStr;

  const token = req.cookies.get("swiftride_token")?.value;
  const targetUrls = resolveTargetUrl(fullPath);

  // Chuẩn bị headers
  const forwardHeaders = new Headers();
  forwardHeaders.set("Content-Type", req.headers.get("Content-Type") || "application/json");

  if (token) {
    forwardHeaders.set("Authorization", `Bearer ${token}`);
  }

  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    forwardHeaders.set("Idempotency-Key", idempotencyKey);
  }

  // Đọc body nếu có
  let reqBody: string | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      reqBody = await req.text();
    } catch {
      reqBody = undefined;
    }
  }

  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const url of targetUrls) {
    try {
      const res = await fetch(url, {
        method: req.method,
        headers: forwardHeaders,
        body: reqBody,
        signal: AbortSignal.timeout(6000),
      });
      lastResponse = res;
      // Nếu thành công hoặc là lỗi nghiệp vụ (400, 401, 403, 404, 409), không cần fallback nữa
      if (res.status < 500) {
        break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!lastResponse) {
    return NextResponse.json(
      {
        status: 503,
        title: "Service Unavailable",
        detail: `Không thể kết nối đến Backend (${pathStr}). Hãy đảm bảo Docker Gateway (cổng 5000) hoặc Microservice đang chạy.`,
      },
      { status: 503 }
    );
  }

  const contentType = lastResponse.headers.get("Content-Type") || "";
  const status = lastResponse.status;

  if (contentType.includes("application/json") || contentType.includes("application/problem+json")) {
    const data = await lastResponse.json();
    return NextResponse.json(data, { status });
  }

  const text = await lastResponse.text();
  return new NextResponse(text, { status, headers: { "Content-Type": contentType || "text/plain" } });
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
