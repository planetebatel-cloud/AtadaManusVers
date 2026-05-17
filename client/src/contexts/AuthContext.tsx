/*
 * ATADA — Auth Context
 * Manages user authentication state across the app.
 * Provides login/logout + auto-refresh on mount.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserProfile } from "@/lib/api";
import { getMe, setTokens, clearTokens, isAuthenticated, getToken } from "@/lib/api";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  authenticated: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  authenticated: false,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      // Race the user fetch against a 6 s ceiling. If the backend is
      // cold-booting we'd rather drop into "unauthed" UI than freeze the
      // whole app behind a spinner for half a minute. AuthContext will
      // retry implicitly on the next interaction that needs the user.
      const timeout = new Promise<UserProfile>((_, reject) =>
        setTimeout(() => reject(new Error("auth-bootstrap timeout")), 6000),
      );
      const me = await Promise.race([getMe(), timeout]);
      setUser(me);
    } catch {
      // Don't clearTokens() on timeout — token may still be valid, backend
      // was just slow. Only clear on an explicit 401 from the API layer
      // (handled by apiFetch's refresh dance).
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    setLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: !!user,
        login,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
