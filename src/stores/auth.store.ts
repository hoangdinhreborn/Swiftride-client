import { create } from "zustand";
import { decodeJwt } from "@/lib/auth/token";
import type { UserRole, UserSession } from "@/types";

interface AuthStore {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (token: string) => UserSession | null;
  logout: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = "swiftride_token";

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (token: string) => {
    const cleanToken = token.trim().replace(/^"|"$/g, "");
    const decoded = decodeJwt(cleanToken);

    if (!decoded || !decoded.sub) {
      set({ user: null, token: null, isLoading: false });
      return null;
    }

    const user: UserSession = {
      id: decoded.sub,
      role: decoded.role,
      name: `${decoded.role} #${decoded.sub.substring(0, 6)}`,
    };

    // Lưu vào localStorage & Cookie riêng cho từng vai trò để hỗ trợ mở song song 2 tab Rider và Driver
    if (typeof window !== "undefined") {
      const roleKey = decoded.role.toLowerCase();
      localStorage.setItem(STORAGE_KEY, cleanToken);
      localStorage.setItem(`swiftride_${roleKey}_token`, cleanToken);

      document.cookie = `swiftride_token=${cleanToken}; Path=/; SameSite=Lax; Max-Age=7200;`;
      document.cookie = `swiftride_${roleKey}_token=${cleanToken}; Path=/; SameSite=Lax; Max-Age=7200;`;
      document.cookie = `swiftride_role=${decoded.role}; Path=/; SameSite=Lax; Max-Age=7200;`;
    }

    set({ user, token: cleanToken, isLoading: false });
    return user;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("swiftride_rider_token");
      localStorage.removeItem("swiftride_driver_token");
      document.cookie = "swiftride_token=; Path=/; Max-Age=0;";
      document.cookie = "swiftride_rider_token=; Path=/; Max-Age=0;";
      document.cookie = "swiftride_driver_token=; Path=/; Max-Age=0;";
      document.cookie = "swiftride_role=; Path=/; Max-Age=0;";
    }
    set({ user: null, token: null, isLoading: false });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;

    let token = localStorage.getItem(STORAGE_KEY);
    const path = window.location.pathname;
    if (path.startsWith("/driver")) {
      token = localStorage.getItem("swiftride_driver_token") || token;
    } else if (path.startsWith("/rider")) {
      token = localStorage.getItem("swiftride_rider_token") || token;
    }

    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    const decoded = decodeJwt(token);
    if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
      localStorage.removeItem(STORAGE_KEY);
      document.cookie = "swiftride_token=; Path=/; Max-Age=0;";
      document.cookie = "swiftride_role=; Path=/; Max-Age=0;";
      set({ user: null, token: null, isLoading: false });
      return;
    }

    const user: UserSession = {
      id: decoded.sub,
      role: decoded.role,
      name: `${decoded.role} #${decoded.sub.substring(0, 6)}`,
    };

    set({ user, token, isLoading: false });
  },
}));
