import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole, UserSession } from "@/types";

const DEFAULT_USER_IDS: Record<UserRole, string> = {
  Rider: "11111111-1111-1111-1111-111111111111",
  Driver: "22222222-2222-2222-2222-222222222222",
  Admin: "33333333-3333-3333-3333-333333333333",
};

export const authService = {
  login: async (role: UserRole, userId?: string): Promise<UserSession> => {
    // Dùng ID cố định chuẩn cho từng vai trò để session luôn ổn định khi test nhiều tab
    const effectiveUserId = userId?.trim() || DEFAULT_USER_IDS[role];

    // Gọi thẳng vào API Gateway /dev/token
    const rawToken = await apiClient.post<string>("/dev/token", {
      role,
      userId: effectiveUserId,
    });

    const user = useAuthStore.getState().setAuth(rawToken);
    if (!user) {
      throw new Error("Không thể phân tích phiên đăng nhập từ token");
    }
    return user;
  },

  logout: () => {
    useAuthStore.getState().logout();
  },
};
