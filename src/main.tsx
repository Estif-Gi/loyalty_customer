import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Guard service worker registration: never run inside Lovable preview iframe
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

if (isInIframe || isPreviewHost) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  }
} else {
  // Register manual service worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = new URL('/sw.js', window.location.origin);
      swUrl.searchParams.set('apiKey', import.meta.env.VITE_FIREBASE_API_KEY ?? '');
      swUrl.searchParams.set('authDomain', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '');
      swUrl.searchParams.set('projectId', import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '');
      swUrl.searchParams.set('storageBucket', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '');
      swUrl.searchParams.set('messagingSenderId', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '');
      swUrl.searchParams.set('appId', import.meta.env.VITE_FIREBASE_APP_ID ?? '');
      swUrl.searchParams.set('measurementId', import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '');

      navigator.serviceWorker.register(swUrl.toString()).then(
        (registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        },
        (err) => {
          console.log('ServiceWorker registration failed: ', err);
        }
      );
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
