import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { readStoredAuthState } from "@/lib/auth";
import type { AuthUser } from "../types";

interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const logoutAction = useAuthStore((state) => state.logout);

  // Sync hydration fallback on mount
  useEffect(() => {
    if (!hasHydrated) {
      const persisted = readStoredAuthState();
      if (persisted.user && persisted.accessToken) {
        useAuthStore.getState().setUser(persisted.user);
        useAuthStore.getState().setAccessToken(persisted.accessToken);
      }
      useAuthStore.getState().setHasHydrated(true);
    }
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;

    // Public routes that don't enforce mandatory login
    // Note: /order/start manages its own login transition while preserving the ?t= token
    const publicRoutes = ["/", "/onboarding", "/order/start"];
    const isPublicRoute = publicRoutes.some(
      (route) => location.pathname === route || location.pathname.startsWith(`${route}/`)
    );

    // Also check token in storage to avoid premature redirects during state transitions
    const hasStoredToken = Boolean(
      accessToken ||
      (typeof window !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("accessToken")))
    );

    const isUserAuth = isAuthenticated || hasStoredToken;

    if (!isUserAuth && !isPublicRoute) {
      navigate("/onboarding", { replace: true, state: { from: location } });
    }
  }, [accessToken, hasHydrated, isAuthenticated, location, navigate]);

  const logout = () => {
    logoutAction();
    navigate("/onboarding", { replace: true });
  };

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: isAuthenticated || Boolean(accessToken),
      isInitialized: hasHydrated,
      user,
      accessToken,
      logout,
    }),
    [accessToken, hasHydrated, isAuthenticated, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
