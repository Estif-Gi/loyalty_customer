// Splash route — redirects based on auth state.
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const Index = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center gradient-warm">
        <div className="h-20 w-20 rounded-3xl gradient-hero shadow-glow flex items-center justify-center animate-pop-in">
          <span className="text-4xl">☕</span>
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/home" : "/onboarding"} replace />;
};

export default Index;
