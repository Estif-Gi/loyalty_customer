/**
 * Centralized, validated environment configuration.
 * Avoids direct unvalidated access to import.meta.env across random components.
 */

export const ENV = {
  API_BASE_URL: (import.meta.env.VITE_API_URL || "https://estif.bahirandelivery.com/api").replace(/\/+$/, ""),
  FIREBASE: {
    VAPID_KEY: import.meta.env.VITE_FIREBASE_VAPID_KEY || "",
    API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || "",
    AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || "",
    MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  },
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
