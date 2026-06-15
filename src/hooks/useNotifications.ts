import { useEffect, useCallback, createElement } from "react";
import { toast } from "sonner";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
const API_URL = import.meta.env.VITE_API_URL as string;

/**
 * Registers the FCM token with the backend so the server can push to this device.
 * Silently no-ops if the user is not authenticated.
 */
async function registerTokenWithBackend(token: string): Promise<void> {
  const authToken = localStorage.getItem("token");
  if (!authToken) return; // unauthenticated – skip

  try {
    await fetch(`${API_URL}/users/fcm-token`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcmToken: token }),
    });
    console.log("[Notifications] FCM token registered with backend ✓");
  } catch (err) {
    console.warn("[Notifications] Failed to register FCM token with backend:", err);
  }
}

export async function registerFcmToken(): Promise<void> {
  const token = await requestNotificationPermission(VAPID_KEY);
  if (token) {
    await registerTokenWithBackend(token);
  }
}

/**
 * useNotifications
 *
 * - On mount, requests push-notification permission and sends the FCM token to
 *   the backend so the server can target this device.
 * - Wires up a foreground message listener that shows an in-app toast banner.
 * - Background / closed-app notifications are handled by the service worker.
 */
export function useNotifications() {
  const init = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    const token = await requestNotificationPermission(VAPID_KEY);
    if (token) {
      await registerTokenWithBackend(token);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  // Foreground message listener – show toast while the app is open
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      // Support both notification-type and data-only payloads
      const title =
        payload.notification?.title ?? payload.data?.title ?? "New notification";
      const body = payload.notification?.body ?? payload.data?.body;
      const url = payload.data?.url;
      const iconUrl = payload.data?.icon;

      toast(title, {
        description: body,
        duration: 6000,
        icon: iconUrl
          ? createElement("img", {
              src: iconUrl,
              alt: "",
              width: 20,
              height: 20,
              style: { borderRadius: "9999px", objectFit: "cover" },
            })
          : "🔔",
        action: url
          ? { label: "View", onClick: () => (window.location.href = url) }
          : undefined,
      });
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);
}
