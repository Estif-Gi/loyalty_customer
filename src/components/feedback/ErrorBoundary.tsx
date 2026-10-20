import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-dvh flex items-center justify-center p-4">
          <ErrorState
            title="Something went wrong"
            message={this.state.error?.message || "An unexpected error occurred while loading this page."}
            onRetry={this.handleReset}
            retryLabel="Reload App"
            onBack={() => {
              window.location.href = "/home";
            }}
            backLabel="Go to Home"
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
