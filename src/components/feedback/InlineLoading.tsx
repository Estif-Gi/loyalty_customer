import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineLoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ className, size = "md", text }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div className={cn("inline-flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-current", sizeClasses[size])} />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
};

export default InlineLoading;
