import { Link, useNavigate } from "react-router-dom";
import { useLoyalty } from "@/lib/store";
import { RESTAURANTS } from "@/lib/mockData";
import { StampCard } from "@/components/StampCard";
import { ChevronRight, Sparkles, Bell } from "lucide-react";

export default function Home() {
  const state = useLoyalty();
  const navigate = useNavigate();

  const visited = RESTAURANTS.filter((r) => state.scans[r.id]);
  const featured = visited.slice(0, 2);
  const totalStamps = Object.values(state.scans).reduce((a, b) => a + b, 0);

  // Find a "close to reward" nudge
  const nudge = (() => {
    for (const r of RESTAURANTS) {
      const c = state.scans[r.id] || 0;
      const next = r.rewards.find((rw) => rw.stampsRequired > c);
      if (next && next.stampsRequired - c <= 2 && next.stampsRequired - c > 0) {
        return { restaurant: r, away: next.stampsRequired - c, reward: next };
      }
    }
    return null;
  })();

  return (
    <div className="px-5 pt-8 pb-4 safe-top">
      <header className="mb-6">
        <p className="text-muted-foreground text-sm">Hello{state.user.name ? `, ${state.user.name}` : ""}</p>
        <h1 className="font-display text-5xl leading-none mt-1">Earn your<br />next reward.</h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-3xl p-5 gradient-hero text-primary-foreground shadow-card relative overflow-hidden">
          <p className="text-xs uppercase tracking-wider opacity-80">Total stamps</p>
          <p className="font-display text-5xl leading-none mt-2">{totalStamps}</p>
          <Sparkles className="absolute right-3 top-3 h-5 w-5 opacity-60" />
        </div>
        <div className="rounded-3xl p-5 bg-card border border-border shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Spots visited</p>
          <p className="font-display text-5xl leading-none mt-2 text-foreground">{visited.length}</p>
        </div>
      </div>

      {/* Nudge */}
      {nudge && (
        <button
          onClick={() => navigate(`/restaurant/${nudge.restaurant.id}`)}
          className="w-full text-left rounded-3xl p-4 mb-6 border border-gold/40 bg-gold/10 flex items-center gap-3 tap-scale"
        >
          <div className="h-11 w-11 rounded-2xl gradient-gold flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-gold-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {nudge.away} more scan{nudge.away === 1 ? "" : "s"} for {nudge.reward.title}!
            </p>
            <p className="text-xs text-muted-foreground truncate">at {nudge.restaurant.name}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      )}

      {/* Featured */}
      {featured.length > 0 ? (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl">Your Cards</h2>
            <Link to="/restaurants" className="text-sm text-primary font-medium">See all</Link>
          </div>
          <div className="space-y-3">
            {featured.map((r) => {
              const count = state.scans[r.id] || 0;
              const next = r.rewards.find((rw) => rw.stampsRequired > count) || r.rewards[r.rewards.length - 1];
              return (
                <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)} className="w-full text-left tap-scale">
                  <StampCard restaurant={r} count={count} goal={next.stampsRequired} compact />
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center mb-6">
          <p className="text-4xl mb-2">📷</p>
          <p className="font-semibold">No stamps yet</p>
          <p className="text-sm text-muted-foreground mt-1">Tap the scan button to get started.</p>
        </div>
      )}

      {/* Discover */}
      <section>
        <h2 className="font-display text-2xl mb-3">Discover Spots</h2>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 scrollbar-hide">
          {RESTAURANTS.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/restaurant/${r.id}`)}
              className="flex-shrink-0 w-40 rounded-3xl bg-card border border-border shadow-soft p-4 text-left tap-scale"
            >
              <div
                className="h-20 rounded-2xl mb-3 flex items-center justify-center text-4xl"
                style={{ background: `hsl(${r.color} / 0.12)` }}
              >
                {r.emoji}
              </div>
              <p className="font-display text-lg leading-tight">{r.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{r.tagline}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
