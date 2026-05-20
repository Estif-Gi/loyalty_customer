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
  // Dynamic goal and size based on count
  let dynamicGoal = goal;
  let stampSize = "text-xs"; // default size
  let stampContainerSize = "w-14 h-14"; // default circle size
  let gridCols = goal <= 5 ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-10";

  if (count >= 10) {
    dynamicGoal = 15;
    stampSize = "text-[10px]"; // smaller
    stampContainerSize = "w-10 h-10"; // smaller circles
    gridCols = "grid-cols-5 sm:grid-cols-10 lg:grid-cols-15"; // adjust grid
  }
  if (count >= 15) {
    dynamicGoal = 20;
    stampSize = "text-[8px]"; // even smaller
    stampContainerSize = "w-8 h-8"; // even smaller circles
    gridCols = "grid-cols-5 sm:grid-cols-10 lg:grid-cols-15 xl:grid-cols-20"; // adjust grid
  }
  if (count >= 20) {
    dynamicGoal = 25;
    stampSize = "text-[9px]"; // even smaller
    stampContainerSize = "w-7 h-7"; // even smaller circles
    gridCols = "grid-cols-5 sm:grid-cols-10 lg:grid-cols-15 xl:grid-cols-20 gap-1"; // adjust grid
  }
  
  const stamps = Array.from({ length: dynamicGoal }, (_, i) => i < count);
  const remaining = Math.max(0, dynamicGoal - count);

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
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">/ {dynamicGoal}</p>
          </div>
        </div>

        <div className={cn("grid gap-2", gridCols)}>
          {stamps.map((filled, i) => (
            <div
              key={i}
              className={cn(
                stampContainerSize,
                "rounded-full border-2 border-dashed flex items-center justify-center transition-all",
                filled
                  ? "border-solid bg-primary text-primary-foreground border-primary scale-100"
                  : "border-border text-muted-foreground/40"
              )}
              style={filled ? { animationDelay: `${i * 40}ms` } : undefined}
            >
              <span className={cn(stampSize, "font-display", filled && "animate-pop-in")}>
                {filled ? restaurant.emoji : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
