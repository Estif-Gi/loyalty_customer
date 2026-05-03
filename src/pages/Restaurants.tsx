import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { loyaltyStore } from "@/lib/store";

export default function Restaurants() {
  const navigate = useNavigate();

  const profile = loyaltyStore((state) => state.user);

  const loyalTo = profile?.loyalTo || [];
  const sorted = [...loyalTo].sort((a: any, b: any) => (b.stamps || 0) - (a.stamps || 0));

  return (
    <div className="px-5 pt-8 pb-4 safe-top">
      <header className="mb-6">
        <p className="text-muted-foreground text-sm">Your spots</p>
        <h1 className="font-display text-5xl leading-none mt-1">Restaurants</h1>
      </header>
      <ul className="space-y-3">
        {sorted.map((l: any) => {
          const count = l.stamps || 0;
          const goal = 10; // Hardcoded default goal for now
          const pct = Math.min(100, (count / goal) * 100);
          
          return (
            <li key={l._id || l.resID}>
              <button
                onClick={() => navigate(`/restaurant/${l.resID}`)}
                className="w-full text-left bg-card border border-border rounded-3xl p-4 shadow-soft tap-scale flex items-center gap-4"
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: `hsl(18 65% 42% / 0.12)` }}
                >
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xl leading-tight">{l.resName || "Unknown Spot"}</p>
                  <p className="text-xs text-muted-foreground mb-2">Your loyalty spot</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{count}/{goal}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
