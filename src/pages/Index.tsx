// Splash route — redirects based on onboarding state.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    navigate(token ? "/home" : "/onboarding", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-dvh flex items-center justify-center gradient-warm">
      <div className="h-20 w-20 rounded-3xl gradient-hero shadow-glow flex items-center justify-center animate-pop-in">
        <span className="text-4xl">☕</span>
      </div>
    </div>
  );
};

export default Index;
