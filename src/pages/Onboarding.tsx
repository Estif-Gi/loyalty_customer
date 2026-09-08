import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, QrCode, Sparkles, Bell } from "lucide-react";
import { toast } from "sonner";
import { loyaltyStore } from "@/lib/store";
import { registerFcmToken } from "@/hooks/useNotifications";
import { normalizeUser, resolveRedirectPath } from "@/lib/auth";
import { ENV } from "@/lib/env";

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = loyaltyStore((state) => state.isAuthenticated);
  const hasStoredSession = Boolean(localStorage.getItem("token") || localStorage.getItem("accessToken")) && Boolean(localStorage.getItem("user"));
  const [step, setStep] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated || (hasStoredSession && localStorage.getItem("user"))) {
      const from = resolveRedirectPath(location.state?.from);
      navigate(from, { replace: true });
    }
  }, [hasStoredSession, isAuthenticated, location.state, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleAuth = async () => {
    if (!phone || !password || (!isLogin && !name)) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        const response = await fetch(`${ENV.API_BASE_URL}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || "Login failed");

        localStorage.setItem("token", data.token);
        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user ?? {}));
        if (data.user) {
          loyaltyStore.getState().login(data.user, data.token);
          loyaltyStore.getState().setOnboarded(true);
        }
        registerFcmToken().catch((err) =>
          console.warn("[Notifications] registerFcmToken failed:", err)
        );
        toast.success("Welcome back!");
      } else {
        const response = await fetch(`${ENV.API_BASE_URL}/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, password, role: "customer" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || "Registration failed");

        localStorage.setItem("token", data.token);
        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user ?? {}));
        if (data.user) {
          loyaltyStore.getState().login(data.user, data.token);
          loyaltyStore.getState().setOnboarded(true);
        }
        registerFcmToken().catch((err) =>
          console.warn("[Notifications] registerFcmToken failed:", err)
        );
        toast.success("Account created successfully!");
      }
      const from = resolveRedirectPath(location.state?.from);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col safe-top">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {step === 0 && (
          <div className="animate-fade-in-up max-w-sm">
            <div className="mx-auto h-28 w-28 rounded-[2rem] gradient-hero shadow-glow flex items-center justify-center mb-8 animate-pop-in">
              <span className="text-6xl">☕</span>
            </div>
            <h1 className="font-display text-6xl mb-3 leading-none">STAMP</h1>
            <p className="text-muted-foreground text-lg mb-10">
              Scan. Stamp. Snack.<br />Loyalty rewards from your favorite spots.
            </p>
            <div className="space-y-3 text-left mb-10">
              <Feature icon={<QrCode className="h-5 w-5" />} title="Scan to earn" desc="Tap the scan button at any partner restaurant." />
              <Feature icon={<Sparkles className="h-5 w-5" />} title="Unlock rewards" desc="Free coffee, slices, tacos — on us." />
              <Feature icon={<Bell className="h-5 w-5" />} title="Stay in the loop" desc="Get nudged when you're one stamp away." />
            </div>
            <Button size="lg" className="w-full h-14 rounded-2xl text-base font-semibold tap-scale" onClick={() => setStep(1)}>
              Get Started
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in-up max-w-sm w-full">
            <img
              src="/images/branding/x.webp"
              alt="Stamp logo"
              className="mx-auto mb-5 h-20 w-20 object-contain"
            />
            <h2 className="font-display text-4xl mb-3 leading-none">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isLogin ? "Log in to view your stamps." : "Sign up to start earning rewards."}
            </p>
            
            <div className="space-y-4 mb-6">
              {!isLogin && (
                <Input
                  placeholder="Your Name (e.g. Alex)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-2xl text-lg"
                />
              )}
              <Input
                placeholder="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 rounded-2xl text-lg"
              />
              <div className="relative">
                <Input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl pr-12 text-lg"
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 rounded-2xl text-base font-semibold tap-scale" 
              onClick={handleAuth}
              disabled={loading}
            >
              {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
            </Button>
            
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-muted-foreground text-sm mt-4 underline-offset-4 hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
            <br />
            <button 
              onClick={() => setStep(0)} 
              className="text-muted-foreground text-sm mt-4 underline-offset-4 hover:underline"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start bg-card/60 backdrop-blur rounded-2xl p-4 border border-border">
      <div className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold leading-tight">{title}</p>
        <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
      </div>
    </div>
  );
}

