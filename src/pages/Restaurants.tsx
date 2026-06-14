import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { loyaltyStore } from "@/lib/store";
import { withOpacity } from "@/lib/utils";

interface Restaurant {
  _id: string;
  name: string;
  phone?: string;
  location?: string;
  themeColor?: string;
  loyaltyProgram?: string[];
}

export default function Restaurants() {
  const navigate = useNavigate();

  const profile = loyaltyStore((state) => state.user);
  const loyalTo = profile?.loyalTo || [];

  const { data: restaurants = [], isLoading, isError } = useQuery<Restaurant[]>({
    queryKey: ["restaurants"],
    queryFn: () => fetchApi("/restaurants") as Promise<Restaurant[]>,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const [loyalRestaurants, otherRestaurants] = useMemo(() => {
    const loyalIds = new Set(loyalTo.map((item: any) => item.resID));
    const loyal = restaurants.filter((restaurant) => loyalIds.has(restaurant._id));
    const other = restaurants.filter((restaurant) => !loyalIds.has(restaurant._id));
    return [loyal, other];
  }, [restaurants, loyalTo]);

  return (
    <div className="px-5 pt-8 pb-4 safe-top">
      <header className="mb-6">
        <p className="text-muted-foreground text-sm">Restaurants</p>
        <h1 className="font-display text-5xl leading-none mt-1">Discover spots</h1>
      </header>

      {isError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Something went wrong loading restaurants.
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-3xl bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {loyalRestaurants.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Loyal spots</p>
                  <h2 className="text-2xl font-semibold">Your current loyalty spots</h2>
                </div>
                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  {loyalRestaurants.length} spot{loyalRestaurants.length !== 1 ? "s" : ""}
                </span>
              </div>

              <ul className="space-y-3">
                {loyalRestaurants.map((l: any) => {
                  // console.log(loyalRestaurants , l);
                  const count = l.stamps || 0;
                  const goal = 10;
                  const pct = Math.min(100, (count / goal) * 100);
                  console.log({ name: l.name, count, pct , loyalRestaurants});
                  return (
                    <li key={l._id || l.resID}>
                      <button
                        onClick={() => navigate(`/restaurant/${l._id}`)}
                        className="w-full text-left bg-card border border-border rounded-3xl p-4 shadow-soft tap-scale flex items-center gap-4"
                      >
                        <div
                          className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                          style={{ background: `hsl(18 65% 42% / 0.12)` }}
                        >
                          🍽️
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-xl leading-tight">{l.name || "Unknown Spot"}</p>
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
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Other spots</p>
                <h2 className="text-2xl font-semibold">Restaurants you aren&apos;t loyal to yet</h2>
              </div>
              <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {otherRestaurants.length} spot{otherRestaurants.length !== 1 ? "s" : ""}
              </span>
            </div>

            {otherRestaurants.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-4 text-sm text-muted-foreground">
                You&apos;re already loyal to all available restaurants.
              </div>
            ) : (
              <ul className="space-y-3">
                {otherRestaurants.map((restaurant) => (
                  <li key={restaurant._id}>
                    <button
                      onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                      className="w-full text-left bg-card border border-border rounded-3xl p-4 shadow-soft tap-scale flex items-center gap-4"
                    >
                      <div
                        className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{ background: restaurant.themeColor ? withOpacity(restaurant.themeColor, 0.2) : "hsl(220 8% 92%)" }}
                      >
                        🍽️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xl leading-tight">{restaurant.name || "Unknown Spot"}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {restaurant.location || restaurant.phone || "No location info"}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {restaurant.loyaltyProgram?.length
                            ? `${restaurant.loyaltyProgram.length} program${restaurant.loyaltyProgram.length > 1 ? "s" : ""}`
                            : "No loyalty program listed"}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
