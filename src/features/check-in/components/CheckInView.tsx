import React from "react";
import { MapPin, Navigation, ShieldCheck, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/feedback/PageLoading";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useCheckIn } from "../hooks/useCheckIn";

export const CheckInView: React.FC = () => {
  const { state, proceedWithCheckIn, redirectToLogin, goHome } = useCheckIn();

  if (state.status === "idle" || state.status === "reading-token" || state.status === "validating") {
    return <PageLoading message="Verifying table & restaurant presence..." />;
  }

  if (state.status === "needs-auth") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center safe-top animate-fade-in-up">
        <div className="mb-6 h-28 w-28 rounded-3xl gradient-hero text-primary-foreground flex items-center justify-center shadow-glow">
          <LogIn className="h-12 w-12" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-2 leading-tight">Log In to Order</h2>
        <p className="text-sm text-muted-foreground max-w-xs mb-8">
          Please log in or create an account to start your table ordering session.
        </p>
        <Button
          onClick={redirectToLogin}
          size="lg"
          className="w-full max-w-xs h-14 rounded-2xl text-base font-semibold tap-scale flex items-center justify-center gap-2"
        >
          <span>Continue to Login</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  if (state.status === "requesting-location") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center safe-top animate-fade-in-up">
        <div className="mb-6 h-32 w-32 flex items-center justify-center">
          <img src="/images/ordering/location.svg" alt="Confirm Location" className="h-full w-full object-contain" />
        </div>

        <h2 className="font-display text-3xl font-bold mb-2 leading-tight">Confirm Your Location</h2>
        <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
          We use your device location to verify that you are physically seated at your table before opening the menu.
        </p>

        <div className="w-full max-w-xs space-y-3">
          <Button
            onClick={proceedWithCheckIn}
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-semibold tap-scale flex items-center justify-center gap-2"
          >
            <Navigation className="h-5 w-5" />
            <span>Verify & Enter Menu</span>
          </Button>

          <Button
            variant="ghost"
            onClick={goHome}
            className="w-full h-12 rounded-2xl text-sm text-muted-foreground"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Secure Geofenced Verification</span>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    const { error } = state;

    if (error.reason === "missing-token") {
      return (
        <EmptyState
          imageSrc="/images/states/empty-state.svg"
          title={error.title}
          description={error.message}
          actionLabel="Go to Home"
          onAction={goHome}
        />
      );
    }

    let imageSrc = "/images/states/invalid-qr.svg";
    if (error.reason === "outside-geofence" || error.reason === "location-accuracy-low") {
      imageSrc = "/images/states/outside-location.svg";
    } else if (error.reason === "offline") {
      imageSrc = "/images/states/offline.svg";
    }

    return (
      <ErrorState
        imageSrc={imageSrc}
        title={error.title}
        message={error.message}
        onRetry={error.canRetry ? proceedWithCheckIn : undefined}
        retryLabel="Try Again"
        onBack={goHome}
        backLabel="Go Home"
      />
    );
  }

  return <PageLoading message="Entering restaurant..." />;
};

export default CheckInView;
