import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { X, Download, Share, Plus, Smartphone } from "lucide-react";

export function PWAInstallBanner() {
  const { isInstallable, isIOS, promptInstall, dismiss } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Slight delay before showing so the page has settled
  useEffect(() => {
    if (!isInstallable) return;
    const t = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(t);
  }, [isInstallable]);

  const hide = (andDismiss = true) => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      setShowIOSSteps(false);
      if (andDismiss) dismiss();
    }, 350);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSSteps(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") hide(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop (only for iOS steps sheet) */}
      {showIOSSteps && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => hide()}
          aria-hidden="true"
        />
      )}

      {/* Main Banner */}
      <div
        role="dialog"
        aria-label="Install app prompt"
        className={[
          "fixed top-0 left-0 right-0 z-50 px-4",
          "transition-transform duration-350 ease-out",
          leaving ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.5rem)", paddingBottom: "0.5rem" }}
      >
        {/* iOS instruction steps (expanded) */}
        {showIOSSteps ? (
          <div className="rounded-2xl overflow-hidden shadow-[0_-4px_40px_-8px_hsl(18_65%_42%/0.35)] border border-white/10 bg-[hsl(18_25%_12%)] text-[hsl(35_30%_95%)]">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-bold tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
                  ADD TO HOME SCREEN
                </p>
                <button
                  onClick={() => hide()}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-3">
                <IOSStep
                  number={1}
                  icon={<Share className="w-5 h-5 text-[hsl(28_80%_58%)]" />}
                  text={<>Tap the <strong>Share</strong> button at the bottom of Safari</>}
                />
                <IOSStep
                  number={2}
                  icon={<Plus className="w-5 h-5 text-[hsl(28_80%_58%)]" />}
                  text={<>Scroll down and tap <strong>"Add to Home Screen"</strong></>}
                />
                <IOSStep
                  number={3}
                  icon={<Smartphone className="w-5 h-5 text-[hsl(28_80%_58%)]" />}
                  text={<>Tap <strong>"Add"</strong> — and you're done! 🎉</>}
                />
              </ol>
            </div>
            <div className="h-1 w-full" style={{ background: "var(--gradient-primary)" }} />
          </div>
        ) : (
          /* Default banner pill */
          <div className="rounded-2xl overflow-hidden shadow-[0_-4px_40px_-8px_hsl(18_65%_42%/0.35)] border border-white/10"
            style={{ background: "linear-gradient(135deg, hsl(18 35% 14%) 0%, hsl(22 30% 10%) 100%)" }}
          >
            {/* Gradient accent stripe */}
            <div className="h-[3px] w-full" style={{ background: "var(--gradient-primary)" }} />

            <div className="px-4 py-3 flex items-center gap-3">
              {/* App icon */}
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md"
                style={{ background: "var(--gradient-hero)" }}
              >
                <img
                  src="/images/branding/L.png"
                  alt="Loyal"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-base leading-none text-[hsl(35_30%_95%)]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
                >
                  INSTALL LOYALTY
                </p>
                <p className="text-xs text-[hsl(35_20%_65%)] mt-0.5 truncate">
                  Faster access · Offline menus · Earn rewards
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  id="pwa-install-btn"
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-[hsl(18_40%_12%)] transition-all active:scale-95 shadow-md"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Install
                </button>
                <button
                  id="pwa-install-dismiss-btn"
                  onClick={() => hide()}
                  className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-[hsl(35_20%_65%)]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function IOSStep({
  number,
  icon,
  text,
}: {
  number: number;
  icon: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-[hsl(28_80%_58%)]">
        {number}
      </span>
      <span className="flex items-center gap-2 text-sm text-[hsl(35_20%_75%)]">
        {icon}
        <span>{text}</span>
      </span>
    </li>
  );
}
