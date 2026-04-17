import { useNavigate } from "react-router-dom";
import { RESTAURANTS } from "@/lib/mockData";
import { useLoyalty } from "@/lib/store";
import { ChevronRight } from "lucide-react";

export default function Restaurants() {
  const state = useLoyalty();
  const navigate = useNavigate();
  const sorted = [...RESTAURANTS].sort((a, b) => (state.visitedAt[b.id] || 0) - (state.visitedAt[a.id] || 0));

  return (
    <div className="px-5 pt-8 pb-4 safe-top">
      <header className="mb-6">
        <p className="text-muted-foreground text-sm">Your spots</p>
        <h1 className="font-display text-5xl leading-none mt-1">Restaurants</h1>
      </header>
      <ul className="space-y-3">
        {sorted.map((r) => {
          const count = state.scans[r.id] || 0;
          const next = r.rewards.find((rw) => rw.stampsRequired > count) || r.rewards[r.rewards.length - 1];
          const pct = Math.min(100, (count / next.stampsRequired) * 100);
          return (
            <li key={r.id}>
              <button
                onClick={() => navigate(`/restaurant/${r.id}`)}
                className="w-full text-left bg-card border border-border rounded-3xl p-4 shadow-soft tap-scale flex items-center gap-4"
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: `hsl(${r.color} / 0.12)` }}
                >
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xl leading-tight">{r.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{r.tagline}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{count}/{next.stampsRequired}</span>
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
