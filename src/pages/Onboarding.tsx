import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loyaltyStore, useLoyalty } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Sparkles, Bell } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const state = useLoyalty();
  const [step, setStep] = useState(state.user.onboarded ? 99 : 0);
  const [name, setName] = useState("");

  if (step === 99) {
    navigate("/home", { replace: true });
    return null;
  }

  const finish = () => {
    loyaltyStore.completeOnboarding(name);
    navigate("/home", { replace: true });
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
            <h2 className="font-display text-5xl mb-3 leading-none">What's your name?</h2>
            <p className="text-muted-foreground mb-8">Optional. Skip to stay anonymous.</p>
            <Input
              autoFocus
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 rounded-2xl text-center text-lg mb-4"
              onKeyDown={(e) => e.key === "Enter" && finish()}
            />
            <Button size="lg" className="w-full h-14 rounded-2xl text-base font-semibold tap-scale" onClick={finish}>
              {name.trim() ? "Continue" : "Continue as Guest"}
            </Button>
            <button onClick={() => setStep(0)} className="text-muted-foreground text-sm mt-4 underline-offset-4 hover:underline">
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
