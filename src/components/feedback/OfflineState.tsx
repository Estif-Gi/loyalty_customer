import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineStateProps {
  onReconnect?: () => void;
  fullPage?: boolean;
}

export const OfflineState: React.FC<OfflineStateProps> = ({ onReconnect, fullPage = false }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onReconnect?.();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onReconnect]);

  if (isOnline) return null;

  if (fullPage) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in safe-top">
        <div className="mb-6 h-36 w-36 flex items-center justify-center">
          <img src="/images/states/offline.svg" alt="Offline" className="h-full w-full object-contain" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">You Are Offline</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Table ordering requires an active internet connection. Please reconnect and try again.
        </p>
        <Button
          onClick={() => {
            if (navigator.onLine) {
              setIsOnline(true);
              onReconnect?.();
            }
          }}
          className="h-12 px-6 rounded-2xl font-semibold tap-scale"
        >
          Check Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-md animate-slide-down">
      <WifiOff className="h-4 w-4" />
      <span>You are offline. Reconnect before placing an order.</span>
    </div>
  );
};

export default OfflineState;
