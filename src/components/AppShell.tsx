import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BottomNav } from "./BottomNav";
import { useNotifications } from "@/hooks/useNotifications";
import { initSocketConnection } from "@/lib/socket";

export function AppShell() {
  const location = useLocation();

  // Request FCM permission & listen for foreground push messages
  useNotifications();

  useEffect(() => {
    initSocketConnection();
  }, []);

  const hideNav = location.pathname === "/" || location.pathname === "/onboarding";

  return (
    <div className="min-h-dvh gradient-warm flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-md pb-28">
        <div key={location.pathname} className={location.pathname === "/scan" ? "h-full" : "animate-fade-in-up"}>
          <Outlet />
        </div>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
