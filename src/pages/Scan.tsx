import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, FlashlightIcon, Sparkles, X } from "lucide-react";
import { parseQR, DEMO_CODES } from "@/lib/qr";
import { loyaltyStore } from "@/lib/store";
import { getRestaurant } from "@/lib/mockData";
import { celebrate, haptic } from "@/lib/confetti";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Scan() {
  const navigate = useNavigate();
  const elId = "qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(elId, { verbose: false });
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (cancelled || !devices.length) {
          if (!devices.length) setError("No camera found.");
          return;
        }
        const camera = devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];
        return scanner.start(
          camera.id,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => handleResult(decoded),
          () => {}
        );
      })
      .catch((e) => {
        console.error(e);
        setError("Camera permission denied or unavailable.");
      });

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {}).finally(() => scannerRef.current?.clear().catch(() => {}));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResult = (text: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    haptic();
    setPulse(true);
    setTimeout(() => processCode(text), 250);
  };

  const processCode = (text: string) => {
    const parsed = parseQR(text);
    if (parsed.kind === "unknown") {
      toast.error("Unrecognized QR code", { description: parsed.raw.slice(0, 60) });
      handledRef.current = false;
      setPulse(false);
      return;
    }
    const restaurant = getRestaurant(parsed.restaurantId);
    if (!restaurant) {
      toast.error("Restaurant not found");
      handledRef.current = false;
      setPulse(false);
      return;
    }

    if (parsed.kind === "loyalty") {
      const before = loyaltyStore.getState().scans[restaurant.id] || 0;
      loyaltyStore.addScan(restaurant.id);
      const after = before + 1;
      const reward = restaurant.rewards.find((r) => r.stampsRequired === after);
      if (reward) celebrate();
      toast.success(reward ? `🎉 ${reward.title} unlocked!` : `+1 stamp at ${restaurant.name}`, {
        description: reward ? "Check your rewards to redeem." : `${after} stamp${after === 1 ? "" : "s"} total`,
      });
      navigate(`/restaurant/${restaurant.id}`, { replace: true });
    } else {
      navigate(`/menu/${restaurant.id}`, { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <div id={elId} className="absolute inset-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/50" style={{
          mask: "radial-gradient(circle at center, transparent 130px, black 132px)",
          WebkitMask: "radial-gradient(circle at center, transparent 130px, black 132px)",
        }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 safe-top p-4 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="h-11 w-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur text-sm font-medium">Point at a Stamp QR</div>
        <div className="w-11" />
      </div>

      {/* Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`relative h-[260px] w-[260px] ${pulse ? "animate-haptic" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute h-8 w-8 border-primary border-[3px]"
              style={{
                top: i < 2 ? -2 : "auto",
                bottom: i >= 2 ? -2 : "auto",
                left: i % 2 === 0 ? -2 : "auto",
                right: i % 2 === 1 ? -2 : "auto",
                borderTopWidth: i < 2 ? 3 : 0,
                borderBottomWidth: i >= 2 ? 3 : 0,
                borderLeftWidth: i % 2 === 0 ? 3 : 0,
                borderRightWidth: i % 2 === 1 ? 3 : 0,
                borderRadius: "8px",
              }}
            />
          ))}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-primary to-transparent animate-scan-line" />
        </div>
      </div>

      {/* Bottom: demo codes */}
      <div className="absolute bottom-0 inset-x-0 p-4 safe-bottom z-10">
        {error && (
          <div className="bg-destructive/90 text-destructive-foreground rounded-2xl p-4 mb-3 text-sm">
            {error} Use a demo code below to continue.
          </div>
        )}
        <details className="bg-black/60 backdrop-blur rounded-2xl text-sm">
          <summary className="cursor-pointer p-4 font-semibold flex items-center gap-2 list-none">
            <Sparkles className="h-4 w-4" /> Try a demo QR (no camera needed)
          </summary>
          <div className="p-3 pt-0 space-y-2">
            {DEMO_CODES.map((d) => (
              <Button
                key={d.code}
                variant="secondary"
                className="w-full justify-start h-11 rounded-xl"
                onClick={() => handleResult(d.code)}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
