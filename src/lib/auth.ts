import type { User } from "@/types";

export type AuthUser = User & {
  id: string;
  _id?: string;
};

export interface PersistedAuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean;
}

const EMPTY_USER: AuthUser = {
  id: "",
  name: "",
  role: "customer",
  loyalTo: [],
  onboarded: false,
};

export function createEmptyUser(): AuthUser {
  return {
    ...EMPTY_USER,
    loyalTo: [],
  };
}

/**
 * Converts backend users into the shape required by the frontend.
 *
 * Supports:
 * { id: "123" }
 * and MongoDB-style:
 * { _id: "123" }
 */
export function normalizeUser(user: unknown): AuthUser | null {
  if (!user || typeof user !== "object" || Array.isArray(user)) {
    return null;
  }

  const candidate = user as Record<string, unknown>;
  const rawId = candidate.id ?? candidate._id;

  if (rawId === null || rawId === undefined) {
    return null;
  }

  const id = String(rawId).trim();
  if (!id) {
    return null;
  }

  const mongoId =
    candidate._id !== null && candidate._id !== undefined
      ? String(candidate._id)
      : undefined;

  return {
    ...createEmptyUser(),
    ...candidate,
    id,
    ...(mongoId ? { _id: mongoId } : {}),
  } as AuthUser;
}

function normalizeToken(token: unknown): string | null {
  if (typeof token !== "string") {
    return null;
  }

  const normalized = token.trim();
  return normalized || null;
}

export function clearStoredAuthentication(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("loyalty-storage");
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("user");
}

/**
 * Reads the persisted authentication state from both Zustand storage
 * and direct localStorage token/user fallback keys.
 */
export function readStoredAuthState(): PersistedAuthState {
  if (typeof window === "undefined") {
    return {
      user: null,
      accessToken: null,
      isInitialized: true,
    };
  }

  try {
    const rawPersistedState = window.localStorage.getItem("loyalty-storage");

    if (rawPersistedState) {
      const parsed = JSON.parse(rawPersistedState) as {
        state?: {
          user?: unknown;
          accessToken?: unknown;
        };
        user?: unknown;
        accessToken?: unknown;
      };

      const persistedState = parsed.state ?? parsed;
      const user = normalizeUser(persistedState.user);
      const accessToken = normalizeToken(persistedState.accessToken);

      if (user && accessToken) {
        return {
          user,
          accessToken,
          isInitialized: true,
        };
      }
    }

    // Fallback: check direct localStorage keys
    const directToken =
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("accessToken");
    const directUser = window.localStorage.getItem("user");

    if (directToken && directUser) {
      try {
        const parsedUser = JSON.parse(directUser);
        const user = normalizeUser(parsedUser);
        const accessToken = normalizeToken(directToken);

        if (user && accessToken) {
          return {
            user,
            accessToken,
            isInitialized: true,
          };
        }
      } catch {}
    }

    return {
      user: null,
      accessToken: null,
      isInitialized: true,
    };
  } catch (error) {
    console.warn("Failed to parse persisted authentication state", error);
    return {
      user: null,
      accessToken: null,
      isInitialized: true,
    };
  }
}

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

  // Reject external and protocol-relative redirects.
  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//")
  ) {
    return "/home";
  }

  return `${pathname}${search}${hash}`;
}