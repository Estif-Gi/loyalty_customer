import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging, type MessagePayload } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate initialization (e.g. hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Messaging is only available in secure browser contexts (not SSR / Node)
let messaging: Messaging | null = null;
if (typeof window !== "undefined" && "Notification" in window) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn("[FCM] Failed to initialize messaging:", err);
  }
}

export { app, messaging };

/**
 * Request notification permission and obtain the FCM registration token.
 * @param vapidKey - Your Web Push VAPID key from the Firebase Console
 *                   (Project Settings → Cloud Messaging → Web Push certificates).
 */
export async function requestNotificationPermission(vapidKey?: string): Promise<string | null> {
  if (!messaging) {
    console.warn("[FCM] Messaging not available in this environment.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission denied.");
      return null;
    }

    // Make sure the service worker is ready before fetching the token
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      // console.log("[FCM] Registration token:", token);
      return token;
    }

    console.warn("[FCM] No registration token available.");
    return null;
  } catch (err) {
    console.error("[FCM] Error getting notification token:", err);
    return null;
  }
}

/**
 * Listen for foreground messages and call the provided callback.
 * Background messages are handled entirely by the service worker.
 */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): () => void {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
