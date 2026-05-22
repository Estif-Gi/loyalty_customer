import { io, type Socket } from "socket.io-client";
import { loyaltyStore } from "@/lib/store";
import type { User } from "@/types";

const SOCKET_URL =import.meta.env.VITE_API_URL;
let socket: Socket | null = null;

interface ProfileDataPayload {
  success: boolean;
  data?: User;
  message?: string;
}

function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function createSocket(token: string): Socket {
  const socketClient = io(`${SOCKET_URL}/api`, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: false,
  });

  socketClient.on("connect", () => {
    console.log("[Socket] connected");
    socketClient.emit("getProfile");
  });

  socketClient.on("connect_error", (error) => {
    console.warn("[Socket] connect error:", error);
  });

  socketClient.on("profileData", (payload: ProfileDataPayload) => {
    if (payload?.success && payload.data) {
      loyaltyStore.getState().setUser(payload.data);
      console.log("[Socket] profile updated from server" , payload.data);
    } else {
      console.error("[Socket] profile fetch failed:", payload?.message);
    }
  });

  return socketClient;
}

export function initSocketConnection(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket && socket.connected) return socket;

  const token = getAuthToken();
  if (!token) return null;

  socket = createSocket(token);
  socket.connect();
  return socket;
}

export function refreshUserProfile(): void {
  const existingSocket = initSocketConnection();
  if (!existingSocket) return;
  existingSocket.emit("getProfile");
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
