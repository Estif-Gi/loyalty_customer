import { io, type Socket } from "socket.io-client";
import { ENV } from "@/lib/env";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { User } from "@/types";

/**
 * Derives the clean Socket.IO server origin from API URL.
 * Strips any trailing '/api' and trailing slashes.
 * e.g. "https://estif.bahirandelivery.com/api" -> "https://estif.bahirandelivery.com"
 */
export function getSocketOrigin(apiUrl = ENV.API_BASE_URL): string {
  const url = (apiUrl || "").trim();
  return url.replace(/\/+$/, "").replace(/\/api$/, "").replace(/\/+$/, "");
}

let socket: Socket | null = null;
let currentToken: string | null = null;

interface ProfileDataPayload {
  success: boolean;
  data?: User;
  message?: string;
}

/**
 * Returns the active Socket.IO singleton instance, if initialized.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Checks whether the singleton socket is currently connected.
 */
export function isSocketConnected(): boolean {
  return Boolean(socket?.connected);
}

/**
 * Creates or retrieves the singleton Socket.IO instance for the customer client.
 */
function createSocketClient(token: string): Socket {
  const socketOrigin = getSocketOrigin();

  const client = io(socketOrigin, {
    autoConnect: false,
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    transports: ["polling", "websocket"], // Allow polling -> websocket upgrade
  });

  // Isolated legacy profile synchronization listener
  client.on("profileData", (payload: ProfileDataPayload) => {
    if (payload?.success && payload.data) {
      useAuthStore.getState().setUser(payload.data);
    }
  });

  return client;
}

/**
 * Establishes or refreshes the customer socket connection using the Zustand auth state.
 * Returns the singleton socket instance.
 */
export function connectSocket(tokenOverride?: string): Socket | null {
  if (typeof window === "undefined") return null;

  const token =
    tokenOverride ||
    useAuthStore.getState().accessToken ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (!token) {
    disconnectSocket();
    return null;
  }

  // If already connected or active with the same token, reuse
  if (socket && currentToken === token) {
    if (!socket.connected && !socket.active) {
      socket.connect();
    }
    return socket;
  }

  // If token changed or socket already exists, tear down previous
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
  }

  currentToken = token;
  socket = createSocketClient(token);
  socket.connect();

  return socket;
}

/**
 * Disconnects the socket singleton and resets internal references.
 */
export function disconnectSocket(): void {
  if (!socket) return;
  try {
    socket.disconnect();
    socket.removeAllListeners();
  } catch (err) {
    console.warn("[Realtime Socket] Error during disconnect:", err);
  } finally {
    socket = null;
    currentToken = null;
  }
}

/**
 * Legacy profile refresh trigger.
 */
export function refreshUserProfile(): void {
  if (!socket) {
    connectSocket();
  }
  socket?.emit("getProfile");
}

/**
 * Backwards-compatible alias for existing callers.
 */
export const initSocketConnection = connectSocket;
