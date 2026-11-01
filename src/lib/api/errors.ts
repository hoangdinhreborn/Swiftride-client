import type { ProblemDetails } from "@/types/backend";

export class ProblemDetailsError extends Error {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;

  constructor(problem: ProblemDetails, fallbackStatus = 500) {
    super(problem.detail || problem.title || "Lỗi xử lý yêu cầu");
    this.name = "ProblemDetailsError";
    this.status = problem.status || fallbackStatus;
    this.title = problem.title || "Lỗi hệ thống";
    this.detail = problem.detail || "Đã xảy ra lỗi không xác định";
    this.errors = problem.errors;
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ProblemDetailsError) {
    if (err.errors) {
      const msgs = Object.values(err.errors).flat();
      if (msgs.length > 0) return msgs.join(", ");
    }
    return err.detail || err.title;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Đã xảy ra lỗi không xác định";
}
