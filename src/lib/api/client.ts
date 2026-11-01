import { ProblemDetailsError } from "./errors";
import type { ProblemDetails } from "@/types/backend";

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { timeoutMs = 8000, headers, ...rest } = options;

  // Endpoint gọi vào route handler BFF (/api/backend/...)
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = `/api/backend/${normalizedEndpoint}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let problem: ProblemDetails;
      try {
        problem = await res.json();
      } catch {
        const text = await res.text();
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

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ProblemDetailsError) {
      throw err;
    }
    if ((err as Error).name === "AbortError") {
      throw new ProblemDetailsError({
        status: 408,
        title: "Timeout",
        detail: "Yêu cầu phản hồi quá lâu, vui lòng thử lại.",
      });
    }
    throw new ProblemDetailsError({
      status: 500,
      title: "Network Error",
      detail: (err as Error).message || "Không thể kết nối đến máy chủ",
    });
  }
}
