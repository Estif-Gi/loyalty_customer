import React from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/feedback/PageLoading";
import { useActiveOrderSession } from "../hooks/useActiveOrderSession";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface OrderSessionGuardProps {
  children?: React.ReactNode;
}

export const OrderSessionGuard: React.FC<OrderSessionGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuth();
  const { session, isExpired, isLoading, hasActiveSession } = useActiveOrderSession();

  if (!isInitialized || (isAuthenticated && isLoading)) {
    return <PageLoading message="Verifying table session..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center safe-top animate-fade-in-up">
        <div className="mb-6 h-32 w-32 flex items-center justify-center">
          <img src="/images/states/empty-state.svg" alt="Login Required" className="h-full w-full object-contain" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Login Required</h2>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Please log in to access table ordering.
        </p>
        <Button onClick={() => navigate("/onboarding")} className="h-12 px-6 rounded-2xl font-semibold tap-scale">
          Log In
        </Button>
      </div>
    );
  }

  if (!hasActiveSession) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center safe-top animate-fade-in-up">
        <div className="mb-6 h-36 w-36 flex items-center justify-center">
          <img
            src={isExpired ? "/images/states/expired-session.svg" : "/images/states/invalid-qr.svg"}
            alt={isExpired ? "Session Expired" : "Scan QR Required"}
            className="h-full w-full object-contain"
          />
        </div>

        <h2 className="font-display text-3xl font-bold mb-2 leading-tight">
          {isExpired ? "Table Session Expired" : "Scan Your Table QR"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
          {isExpired
            ? "Your table ordering session has timed out. Scan the same table QR code to start a new session."
            : "To view the menu and place orders, scan the QR code located on your restaurant table."}
        </p>

        <div className="w-full max-w-xs space-y-3">
          <Button
            onClick={() => navigate("/scan")}
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-semibold tap-scale flex items-center justify-center gap-2"
          >
            <QrCode className="h-5 w-5" />
            <span>Scan Table QR</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/home")}
            className="w-full h-12 rounded-2xl text-sm font-medium tap-scale flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Home</span>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OrderSessionGuard;
