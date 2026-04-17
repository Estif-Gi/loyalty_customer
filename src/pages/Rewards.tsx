import { useNavigate } from "react-router-dom";
import { useLoyalty } from "@/lib/store";
import { RESTAURANTS } from "@/lib/mockData";
import { Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Rewards() {
  const state = useLoyalty();
  const navigate = useNavigate();

  type Item = { restaurantId: string; rewardId: string; title: string; stampsRequired: number; ready: boolean; remaining: number };
  const all: Item[] = RESTAURANTS.flatMap((r) => {
    const c = state.scans[r.id] || 0;
    return r.rewards.map((rw) => ({
      restaurantId: r.id,
      rewardId: rw.id,
      title: rw.title,
      stampsRequired: rw.stampsRequired,
      ready: c >= rw.stampsRequired,
      remaining: Math.max(0, rw.stampsRequired - c),
    }));
  });

  const ready = all.filter((i) => i.ready);
  const inProgress = all.filter((i) => !i.ready).sort((a, b) => a.remaining - b.remaining);

  const totalRedeemed = Object.values(state.redeemed).flat().length;

  return (
    <div className="px-5 pt-8 pb-4 safe-top">
      <header className="mb-6">
        <p className="text-muted-foreground text-sm">Your perks</p>
        <h1 className="font-display text-5xl leading-none mt-1">Rewards</h1>
      </header>

      <div className="rounded-3xl gradient-gold p-5 mb-6 text-gold-foreground shadow-card relative overflow-hidden">
        <Sparkles className="absolute right-4 top-4 h-5 w-5 opacity-60" />
        <p className="text-xs uppercase tracking-wider opacity-80">Total redeemed</p>
        <p className="font-display text-5xl leading-none mt-2">{totalRedeemed}</p>
        <p className="text-sm opacity-80 mt-1">{ready.length} ready right now</p>
      </div>

      {ready.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-2xl mb-3">Ready to redeem</h2>
          <div className="space-y-3">
            {ready.map((i) => {
              const r = RESTAURANTS.find((x) => x.id === i.restaurantId)!;
              return (
                <button
                  key={`${i.restaurantId}-${i.rewardId}`}
                  onClick={() => navigate(`/restaurant/${i.restaurantId}`)}
                  className="w-full text-left rounded-3xl p-4 bg-gold/15 border border-gold/40 flex items-center gap-3 tap-scale"
                >
                  <div className="h-12 w-12 rounded-2xl gradient-gold flex items-center justify-center">
                    <Gift className="h-6 w-6 text-gold-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight">{i.title}</p>
                    <p className="text-xs text-muted-foreground">{r.emoji} {r.name}</p>
                  </div>
                  <Button size="sm" className="rounded-xl">Redeem</Button>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl mb-3">In progress</h2>
        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">All rewards unlocked. Keep scanning!</p>
        ) : (
          <div className="space-y-3">
            {inProgress.map((i) => {
              const r = RESTAURANTS.find((x) => x.id === i.restaurantId)!;
              const pct = Math.min(100, ((i.stampsRequired - i.remaining) / i.stampsRequired) * 100);
              return (
                <button
                  key={`${i.restaurantId}-${i.rewardId}`}
                  onClick={() => navigate(`/restaurant/${i.restaurantId}`)}
                  className="w-full text-left bg-card border border-border rounded-3xl p-4 shadow-soft tap-scale"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-xl">{r.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-tight truncate">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{r.name} · {i.remaining} more</p>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
