"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import type { UserRole } from "@/types";

export function useAuth() {
  const { user, token, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = async (role: UserRole, userId?: string) => {
    return authService.login(role, userId);
  };

  const logout = () => {
    authService.logout();
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };
}
