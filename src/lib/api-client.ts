import { ProblemDetailsError } from "./errors";
import { useAuthStore } from "@/stores/auth.store";
import type { ProblemDetails } from "@/types";

interface RequestOptions extends Omit<RequestInit, "body"> {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl = "/gateway";

  private async request<T>(
    endpoint: string,
    method: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeoutMs = 8000, headers = {}, ...rest } = options;

    const normalizedPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedPath}`;

    // 1. Tự động gắn Token: ưu tiên token của vai trò tương ứng với trang hiện tại
    let token = useAuthStore.getState().token;
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/driver")) {
        token = localStorage.getItem("swiftride_driver_token") || token;
      } else if (path.startsWith("/rider")) {
        token = localStorage.getItem("swiftride_rider_token") || token;
      }
    }

    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...rest,
      });

      clearTimeout(timer);

      if (!res.ok) {
        let problem: ProblemDetails;
        const text = await res.text().catch(() => "");
        try {
          problem = JSON.parse(text);
        } catch {
          problem = {
            status: res.status,
            title: res.statusText || "Lỗi yêu cầu",
            detail: text || `HTTP ${res.status}`,
          };
        }
        throw new ProblemDetailsError(problem, res.status);
      }

      if (res.status === 204) {
        return {} as T;
      }

      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/json") || contentType.includes("application/problem+json")) {
        return await res.json();
      }

      const text = await res.text();
      return text as unknown as T;
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof ProblemDetailsError) {
        throw err;
      }
      if ((err as Error).name === "AbortError") {
        throw new ProblemDetailsError({
          status: 408,
          title: "Timeout",
          detail: "Yêu cầu phản hồi quá lâu, vui lòng kiểm tra lại kết nối.",
        });
      }
      throw new ProblemDetailsError({
        status: 500,
        title: "Network Error",
        detail: (err as Error).message || "Không thể kết nối đến API Gateway (cổng 5000)",
      });
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "GET", undefined, options);
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "POST", body, options);
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "PUT", body, options);
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "DELETE", undefined, options);
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "PATCH", body, options);
  }
}

export const apiClient = new ApiClient();
