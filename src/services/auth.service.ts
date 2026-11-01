import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole, UserSession } from "@/types";

export const authService = {
  login: async (role: UserRole, userId?: string): Promise<UserSession> => {
    // Gọi thẳng vào API Gateway /dev/token
    const rawToken = await apiClient.post<string>("/dev/token", {
      role,
      userId: userId || undefined,
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
