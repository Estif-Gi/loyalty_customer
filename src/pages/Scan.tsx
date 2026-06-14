import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Html5Qrcode , Html5QrcodeScannerState} from "html5-qrcode";
import { ArrowLeft, Sparkles, QrCode as QrCodeIcon, X, Camera } from "lucide-react";
import QRCode from "react-qr-code";
import { parseQR  } from "@/lib/qr";
import { fetchApi } from "@/lib/api";
import { celebrate, haptic } from "@/lib/confetti";
import { loyaltyStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Scan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const elId = "qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showMyCode, setShowMyCode] = useState(false);
  const handledRef = useRef(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchApi("/users/profile"),
  });

  const startScanner = () => {
    let cancelled = false;
    const scanner = new Html5Qrcode(elId, { verbose: false });
    scannerRef.current = scanner;
    setIsScanning(true);
    setError(null);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (cancelled || !devices.length) {
          if (!devices.length) {
            setError("No camera found.");
            setIsScanning(false);
          }
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
        setIsScanning(false);
      });
  };

 useEffect(() => {
  return () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    const state = scanner.getState();
    const canStop =
      state === Html5QrcodeScannerState.SCANNING ||
      state === Html5QrcodeScannerState.PAUSED;

    if (canStop) {
      void scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          scanner.clear();
        });
    } else {
      try {
        scanner.clear();
      } catch {}
    }
  };
}, []);

  const handleResult = (text: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    haptic();
    setPulse(true);
    setTimeout(() => processCode(text), 250);
  };

  const processCode = async (text: string) => {
    const parsed = parseQR(text);
    if (parsed.kind === "unknown") {
      toast.error("Unrecognized QR code");
      handledRef.current = false;
      setPulse(false);
      return;
    }

    try {
      await fetchApi(`/restaurants/${parsed.restaurantId}`, { skipAuth: true });
    } catch (err) {
      toast.error("Restaurant not found");
      handledRef.current = false;
      setPulse(false);
      return;
    }

    if (parsed.kind === "loyalty") {
      try {
        if (!profile?._id) throw new Error("Not logged in");

        await fetchApi("/users/stamps", {
          method: "POST",
          body: JSON.stringify({
            customerId: profile.id,
            restaurantId: parsed.restaurantId,
            stampsToAdd: 1,
          }),
        });

        celebrate();
        toast.success(`+1 stamp added!`);
        const updatedProfile = await fetchApi("/users/profile");
        loyaltyStore.getState().setUser(updatedProfile);
        navigate(`/restaurant/${parsed.restaurantId}`, { replace: true });
      } catch (err: any) {
        toast.error(err.message || "Failed to add stamp");
        handledRef.current = false;
        setPulse(false);
      }
    } else {
      navigate(`/menu/${parsed.restaurantId}`, { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-black text-white">
      {/* Camera feed */}
      <div id={elId} className="absolute inset-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

      {/* Dimming overlay — lighter than before so it feels airier */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 inset-x-0 safe-top p-4 z-10">
        <div className="w-full max-w-sm mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => {
              navigate(-1);
              setIsScanning(false);
              setShowMyCode(false);
            }}
            className="h-11 w-11 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center tap-scale"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1 text-center px-3 py-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md text-xs sm:text-sm font-medium shadow-soft truncate">
            Point at a Stamp QR
          </div>

          <button
            onClick={() => setShowMyCode(true)}
            className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-soft backdrop-blur flex items-center justify-center tap-scale"
          >
            <QrCodeIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Camera error banner */}
      {error && (
        <div className="absolute top-20 inset-x-4 z-20">
          <div className="max-w-sm mx-auto bg-red-200 text-white rounded-2xl p-4 flex items-start gap-3 shadow">
            <div className="flex-1">
              <p className="font-medium text-black">Camera error</p>
              <p className="text-sm opacity-90 text-black mt-1">{error}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={() => {
                    setError(null);
                    startScanner();
                  }}
                >
                  Retry
                </Button>
                <Button
                  className="bg-orange-200 text-black"
                  variant="ghost"
                  onClick={() => {
                    setError(null);
                    setIsScanning(false);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reticle / Start button — REDESIGNED ── */}
      <div className="absolute inset-0 pb-32 flex items-center justify-center pointer-events-none z-[2]">
        {!isScanning ? (
          /* ── Tap-to-scan button: soft white card feel ── */
          <button
            onClick={startScanner}
            className="pointer-events-auto flex flex-col items-center justify-center gap-4
                       h-52 w-52 sm:h-56 sm:w-56 rounded-3xl
                       bg-white/90 
                       
                       tap-scale transition-all duration-200 active:scale-95
                       animate-in zoom-in"
          >
            {/* Soft icon container */}
            <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center
                            ">
              <Camera className="h-8 w-8 text-orange-400" strokeWidth={1.75} />
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-bold text-base tracking-wide leading-none">Tap to Scan</p>
              <p className="text-gray-400 text-xs mt-1.5 font-medium">Point at a stamp QR code</p>
            </div>
          </button>
        ) : (
          /* ── Active scanning reticle: white corners, warm scan line ── */
          <div
            className={`relative h-[230px] w-[230px] sm:h-[260px] sm:w-[260px]`}
          >
            {/* Frosted glass inner panel */}
            {/* <div className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-[2px] " /> */}

            {/* Corner brackets — crisp white */}
            {/* {[
              "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
              "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
              "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
              "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
            ].map((cls, i) => (
              <span key={i} className={`absolute h-8 w-8 border-white/90 ${cls}`} />
            ))} */}

            {/* Warm amber scan line */}
            <div
              className="absolute inset-x-3 h-0.5 rounded-full
                         bg-gradient-to-r from-transparent to-transparent
                         
                         animate-scan-line"
            />

            {/* Subtle "Scanning…" label beneath */}
            {/* <p className="absolute -bottom-9 inset-x-0 text-center text-white/70 text-xs font-medium tracking-widest uppercase animate-pulse">
              Scanning…
            </p> */}
          </div>
        )}
      </div>

      

      {/* ── Show My Code overlay (unchanged) ── */}
      {showMyCode && profile && (
        <div className="absolute inset-0 z-[60] bg-black/85 backdrop-blur-xl text-white flex flex-col items-center justify-center p-6 pb-28 animate-in fade-in duration-300">
          <div className="absolute top-0 inset-x-0 safe-top p-4 flex justify-end items-center">
            <button
              onClick={() => setShowMyCode(false)}
              className="bg-black/50 border border-white/15 h-11 w-11 rounded-full backdrop-blur transition-colors flex items-center justify-center tap-scale"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.15)] border border-white/80 flex flex-col items-center max-w-[340px] w-full mx-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-2 rounded-2xl border-2 border-gray-100 mb-6 shadow-sm w-full aspect-square flex items-center justify-center">
              <QRCode
                value={JSON.stringify({ customerId: profile._id, name: profile.name })}
                size={240}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <h3 className="font-display text-3xl text-gray-900 leading-none mb-2 text-center">{profile.name}</h3>
            <p className="text-gray-500 text-center font-medium leading-tight">
              Show this code to the cashier
              <br />
              to collect your stamps
            </p>
          </div>
        </div>
      )}
    </div>
  );
}