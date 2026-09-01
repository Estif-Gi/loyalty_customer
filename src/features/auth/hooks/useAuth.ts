import { useAuthStore } from "../store/authStore";

export function resolveRedirectPath(
  location:
    | {
        pathname?: string;
        search?: string;
        hash?: string;
      }
    | null
    | undefined
): string {
  const pathname = location?.pathname ?? "/home";
  const search = location?.search ?? "";
  const hash = location?.hash ?? "";

  // Reject external and protocol-relative redirects for security
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return "/home";
  }

  return `${pathname}${search}${hash}`;
}

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const setOnboarded = useAuthStore((state) => state.setOnboarded);

  return {
    user,
    accessToken,
    isAuthenticated,
    isInitialized: hasHydrated,
    login,
    logout,
    setUser,
    setOnboarded,
    resolveRedirectPath,
  };
}
