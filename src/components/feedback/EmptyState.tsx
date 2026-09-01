import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  imageSrc?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  imageSrc = "/images/states/empty-state.svg",
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 text-center animate-fade-in-up", className)}>
      <div className="mb-6 h-36 w-36 flex items-center justify-center">
        {icon ? (
          <div className="h-24 w-24 rounded-3xl bg-secondary/80 flex items-center justify-center text-primary shadow-soft">
            {icon}
          </div>
        ) : (
          <img src={imageSrc} alt={title} className="h-full w-full object-contain" />
        )}
      </div>

      <h3 className="font-display text-2xl font-bold text-foreground mb-2 leading-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{description}</p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="w-full h-12 rounded-2xl font-semibold tap-scale">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
            className="w-full h-12 rounded-2xl font-semibold tap-scale"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
