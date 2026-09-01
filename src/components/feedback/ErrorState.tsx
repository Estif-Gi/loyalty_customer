import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  imageSrc?: string;
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  imageSrc = "/images/states/invalid-qr.svg",
  title = "Something Went Wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  onBack,
  backLabel = "Go Back",
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 text-center animate-fade-in-up", className)}>
      <div className="mb-6 h-36 w-36 flex items-center justify-center">
        <img src={imageSrc} alt={title} className="h-full w-full object-contain" />
      </div>

      <h3 className="font-display text-2xl font-bold text-foreground mb-2 leading-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{message}</p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {onRetry && (
          <Button onClick={onRetry} className="w-full h-12 rounded-2xl font-semibold tap-scale">
            {retryLabel}
          </Button>
        )}
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full h-12 rounded-2xl font-semibold tap-scale"
          >
            {backLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
