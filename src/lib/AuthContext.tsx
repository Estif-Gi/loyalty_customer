import React, { createContext, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loyaltyStore } from "./store";

interface AuthContextType {
  isLoggedIn: boolean;
  user: any;
  logout: () => void;
  hasHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const user = loyaltyStore((state) => state.user);
  const hasHydrated = loyaltyStore((state) => state.hasHydrated);
  const isLoggedIn = !!user?.id;

  // Detect back button and prevent access to protected pages
  useEffect(() => {
    const handlePopState = () => {
      if (!isLoggedIn && window.location.pathname !== "/onboarding") {
        navigate("/onboarding", { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isLoggedIn, navigate]);

  const logout = () => {
    loyaltyStore.getState().setUser({
      id: "",
      name: "",
      role: "customer",
      loyalTo: [],
      onboarded: false,
    });
    // Replace history so back button doesn't restore protected pages
    navigate("/onboarding", { replace: true });
    // Clear history stack to prevent going back to protected pages
    window.history.pushState(null, "", window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        logout,
        hasHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 * Must be used inside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

/**
 * HOC to protect routes from unauthorized access
 */
export const withAuthCheck = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isLoggedIn, hasHydrated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (hasHydrated && !isLoggedIn) {
        navigate("/onboarding", { replace: true });
      }
    }, [isLoggedIn, hasHydrated, navigate]);

    if (!hasHydrated) return null;
    if (!isLoggedIn) return null;

    return <Component {...props} />;
  };
};
