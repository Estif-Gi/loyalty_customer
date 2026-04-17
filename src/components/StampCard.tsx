import { Restaurant } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function StampCard({
  restaurant,
  count,
  goal,
  compact = false,
}: {
  restaurant: Restaurant;
  count: number;
  goal: number;
  compact?: boolean;
}) {
  const stamps = Array.from({ length: goal }, (_, i) => i < count);
  const remaining = Math.max(0, goal - count);

  return (
    <div
      className={cn(
        "rounded-3xl p-5 shadow-card border border-border bg-card relative overflow-hidden",
        compact && "p-4"
      )}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ background: `radial-gradient(circle at 100% 0%, hsl(${restaurant.color}), transparent 60%)` }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{restaurant.emoji}</span>
            <div>
              <p className="font-display text-lg leading-none">{restaurant.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {remaining === 0 ? "Reward ready! 🎉" : `${remaining} scan${remaining === 1 ? "" : "s"} to go`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-primary leading-none">{count}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">/ {goal}</p>
          </div>
        </div>

        <div className={cn("grid gap-2", goal <= 5 ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-10")}>
          {stamps.map((filled, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-full border-2 border-dashed flex items-center justify-center transition-all",
                filled
                  ? "border-solid bg-primary text-primary-foreground border-primary scale-100"
                  : "border-border text-muted-foreground/40"
              )}
              style={filled ? { animationDelay: `${i * 40}ms` } : undefined}
            >
              <span className={cn("text-xs font-display", filled && "animate-pop-in")}>
                {filled ? restaurant.emoji : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
