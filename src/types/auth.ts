export type UserRole = "Rider" | "Driver" | "Admin";

export interface UserSession {
  id: string;
  role: UserRole;
  name: string;
}

export interface LoginRequest {
  role: UserRole;
  userId?: string;
}

export interface AuthState {
  user: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
