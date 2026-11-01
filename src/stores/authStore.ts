import { create } from "zustand";
import type { UserRole, UserSession } from "@/types/auth";

interface AuthStore {
  user: UserSession | null;
  isLoading: boolean;
  setUser: (user: UserSession | null) => void;
  checkAuth: () => Promise<UserSession | null>;
  login: (role: UserRole, userId?: string) => Promise<UserSession>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        set({ user: null, isLoading: false });
        return null;
      }
      const data = await res.json();
      set({ user: data.user, isLoading: false });
      return data.user;
    } catch {
      set({ user: null, isLoading: false });
      return null;
    }
  },

  login: async (role: UserRole, userId?: string) => {
    set({ isLoading: true });
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, userId }),
    });

    if (!res.ok) {
      set({ isLoading: false });
      const err = await res.json();
      throw new Error(err.error || err.detail || "Đăng nhập thất bại");
    }

    const data = await res.json();
    set({ user: data.user, isLoading: false });
    return data.user;
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set({ user: null, isLoading: false });
    }
  },
}));
