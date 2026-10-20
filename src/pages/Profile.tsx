import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, RotateCcw, Smartphone, Receipt, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { loyaltyStore } from "@/lib/store";
import { disconnectSocket } from "@/lib/socket";
import { useCustomerOrders } from "@/features/orders/hooks/useCustomerOrders";
import { useActiveOrderSession } from "@/features/order-session/hooks/useActiveOrderSession";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const profile = loyaltyStore((state) => state.user);
  const { hasActiveSession } = useActiveOrderSession();
  const { orders: activeOrders } = useCustomerOrders("active");
  const hasActiveOrders = activeOrders.length > 0;

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const loyalTo = profile?.loyalTo || [];
  const totalStamps = loyalTo.reduce((acc: number, curr: any) => acc + curr.stamps, 0);
  const totalRedeemed = 0; // Not tracked by backend yet

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loyalty-storage");
    localStorage.removeItem("auth-storage");
    queryClient.clear();
    loyaltyStore.getState().logout();
    toast.success("Logged out");
    navigate("/onboarding", { replace: true });
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) return toast.error("Notifications not supported");
    const result = await Notification.requestPermission();
    if (result === "granted") {
      toast.success("Notifications enabled!");
      new Notification("Stamp", { body: "We'll let you know when you're close to a reward 🎉" });
    } else {
      toast.error("Notifications blocked");
    }
  };

  const installApp = async () => {
    if (!installPrompt) return toast.info("Use your browser menu → 'Add to Home Screen'");
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="px-5 pt-8 pb-4 safe-top">
      <header className="mb-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl gradient-hero text-primary-foreground flex items-center justify-center font-display text-2xl shadow-glow">
          {((profile?.name || "G")[0]).toUpperCase()}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Member</p>
          <h1 className="font-display text-3xl leading-none">{profile?.name || "Guest"}</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label="Stamps" value={totalStamps} />
        <Stat label="Redeemed" value={totalRedeemed} />
      </div>

      <div className="space-y-2 mb-6">
        <Row
          icon={<Receipt className="h-5 w-5" />}
          title="Order History"
          desc={hasActiveOrders ? "You have an active table order in progress" : "View active orders & past receipts"}
          onClick={() => navigate(hasActiveOrders ? "/order/history?tab=active" : "/order/history")}
          badge={
            hasActiveOrders ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            ) : undefined
          }
        />
        <Row icon={<Smartphone className="h-5 w-5" />} title="Install App" desc="Add Stamp to your home screen" onClick={installApp} />
        <Row icon={<Bell className="h-5 w-5" />} title="Notifications" desc="Get reward nudges" onClick={requestNotifications} />
      </div>

      <div className="space-y-2">
        <Row icon={<LogOut className="h-5 w-5" />} title="Log Out" desc="Sign out of your account" onClick={logout} variant="destructive" />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-10">Stamp · v1.0 · Made with ☕</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-4xl leading-none mt-2">{value}</p>
    </div>
  );
}

function Row({
  icon,
  title,
  desc,
  onClick,
  variant,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  variant?: "destructive";
  badge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-3 tap-scale shadow-soft group transition-all"
    >
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          variant === "destructive"
            ? "bg-destructive/10 text-destructive"
            : "bg-secondary text-foreground group-hover:text-primary transition-colors"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-semibold leading-tight ${variant === "destructive" ? "text-destructive" : ""}`}>{title}</p>
          {badge}
        </div>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}
