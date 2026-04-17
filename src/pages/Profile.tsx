import { useNavigate } from "react-router-dom";
import { useLoyalty, loyaltyStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, RotateCcw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function Profile() {
  const state = useLoyalty();
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const totalStamps = Object.values(state.scans).reduce((a, b) => a + b, 0);
  const totalRedeemed = Object.values(state.redeemed).flat().length;

  const reset = () => {
    loyaltyStore.reset();
    toast.success("Account reset");
    navigate("/", { replace: true });
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
          {(state.user.name || "G")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Member</p>
          <h1 className="font-display text-3xl leading-none">{state.user.name || "Guest"}</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label="Stamps" value={totalStamps} />
        <Stat label="Redeemed" value={totalRedeemed} />
      </div>

      <div className="space-y-2 mb-6">
        <Row icon={<Smartphone className="h-5 w-5" />} title="Install App" desc="Add Stamp to your home screen" onClick={installApp} />
        <Row icon={<Bell className="h-5 w-5" />} title="Notifications" desc="Get reward nudges" onClick={requestNotifications} />
      </div>

      <div className="space-y-2">
        <Row icon={<RotateCcw className="h-5 w-5" />} title="Reset account" desc="Clear stamps and rewards" onClick={reset} variant="destructive" />
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
  icon, title, desc, onClick, variant,
}: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; variant?: "destructive" }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-3 tap-scale shadow-soft"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-semibold leading-tight ${variant === "destructive" ? "text-destructive" : ""}`}>{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}
