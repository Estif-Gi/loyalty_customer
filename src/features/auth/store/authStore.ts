import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeUser, readStoredAuthState, clearStoredAuthentication } from "@/lib/auth";
import type { AuthUser } from "../types";

export { normalizeUser };

function normalizeAccessToken(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const normalized = token.trim();
  return normalized || null;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  login: (user: unknown, token: string) => void;
  setUser: (user: unknown | null) => void;
  setAccessToken: (token: string | null) => void;
  setOnboarded: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

// Read initial state synchronously from storage
const initialStored = readStoredAuthState();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: initialStored.user,
      accessToken: initialStored.accessToken,
      isAuthenticated: Boolean(initialStored.user?.id && initialStored.accessToken),
      hasHydrated: typeof window === "undefined" ? false : true,

      login: (rawUser, rawToken) => {
        const user = normalizeUser(rawUser);
        const accessToken = normalizeAccessToken(rawToken);

        if (!user) throw new Error("Login response missing valid user ID");
        if (!accessToken) throw new Error("Login response missing access token");

        if (typeof window !== "undefined") {
          localStorage.setItem("token", accessToken);
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("user", JSON.stringify(user));
        }

        set({
          user,
          accessToken,
          isAuthenticated: true,
          hasHydrated: true,
        });
      },

      setUser: (rawUser) => {
        const user = normalizeUser(rawUser);
        const currentToken =
          get().accessToken ||
          (typeof window !== "undefined"
            ? localStorage.getItem("token") || localStorage.getItem("accessToken")
            : null);

        set((state) => {
          const resolvedUser = user || state.user;
          const resolvedToken = currentToken || state.accessToken;
          return {
            user: resolvedUser,
            accessToken: resolvedToken,
            isAuthenticated: Boolean(resolvedUser?.id && resolvedToken),
          };
        });
      },

      setAccessToken: (rawToken) => {
        const accessToken = normalizeAccessToken(rawToken);
        set((state) => ({
          accessToken,
          isAuthenticated: Boolean(accessToken && (state.user?.id || state.user?._id)),
        }));
      },

      setOnboarded: (onboarded) => {
        set((state) => {
          if (!state.user) return {};
          return {
            user: { ...state.user, onboarded },
          };
        });
      },

      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },

      logout: () => {
        clearStoredAuthentication();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          hasHydrated: true,
        });
      },
    }),
    {
      name: "loyalty-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      merge: (persistedState: any, currentState) => {
        const user = normalizeUser(persistedState?.user) || currentState.user;
        const accessToken = normalizeAccessToken(persistedState?.accessToken) || currentState.accessToken;

        return {
          ...currentState,
          user,
          accessToken,
          isAuthenticated: Boolean(user?.id && accessToken),
          hasHydrated: true,
        };
      },
      onRehydrateStorage: () => {
        return (state) => {
          state?.setHasHydrated(true);
        };
      },
    }
  )
);
