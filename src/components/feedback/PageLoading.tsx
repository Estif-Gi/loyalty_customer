import React from "react";
import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center safe-top animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Loader2 className="absolute h-6 w-6 text-primary animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
};

export default PageLoading;
