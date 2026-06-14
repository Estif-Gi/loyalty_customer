import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Gift, Sparkles, MapPin } from "lucide-react";
import { loyaltyStore } from "@/lib/store";
import {withOpacity} from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL;

type Reward = {
  stampsRequired: number;
  rewardDescription: string;
  _id: string;
};

type LoyaltyProgram = {
  _id: string;
  rewards: Reward[];
  // ... other fields
};

type RestaurantResponse = {
  themeColor: string;
  name: string;
  location: string;
  programs: LoyaltyProgram[];
};

export default function Rewards() {
  const navigate = useNavigate();

  const profile = loyaltyStore((state) => state.user);
  const loyalTo = profile?.loyalTo || [];
  const token = localStorage.getItem("token");

  const { data: inProgress = [], isLoading, error } = useQuery({
    queryKey: ["rewards-by-loyalty", loyalTo.map((l: any) => `${l.resID}:${l.stamps}`)],
    enabled: loyalTo.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        loyalTo.map(async (l: any) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/loyalty/restaurant/${l.resID}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              }
            );

            if (!response.ok) {
              throw new Error(`Failed to load rewards for ${l.resName || "restaurant"}`);
            }

            const payload: RestaurantResponse = await response.json();

            // Extract top-level restaurant info
            const restaurantName = payload.name || l.resName || "Unknown Spot";
            const themeColor = payload.themeColor || "#f59e0b"; // fallback
            const location = payload.location;

            // Get the first loyalty program (most APIs return only one)
            const program = payload.programs?.[0];
            if (!program || !program.rewards?.length) return null;

            const rewards = [...program.rewards].sort(
              (a, b) => a.stampsRequired - b.stampsRequired
            );

            const userStamps = l.stamps || 0;

            // Find the next reward the user is working toward
            const nextReward =
              rewards.find((r) => r.stampsRequired >= userStamps) ||
              rewards[rewards.length - 1];

            return {
              restaurantId: l.resID,
              restaurantName,
              themeColor,
              location,
              stamps: userStamps,
              stampsRequired: nextReward.stampsRequired,
              rewardDescription: nextReward.rewardDescription || "Reward",
              remaining: Math.max(0, nextReward.stampsRequired - userStamps),
              rewardId: nextReward._id,
            };
          } catch (err) {
            console.error(`Error fetching restaurant ${l.resID}:`, err);
            return null;
          }
        })
      );

      return results.filter(Boolean);
    },
  });

  const totalRedeemed = 0; // TODO: fetch from backend when available

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
        <p className="text-sm opacity-80 mt-1">Visit spots to see ready rewards</p>
      </div>

      <section>
        <h2 className="font-display text-2xl mb-3">In progress</h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading rewards...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Failed to load rewards. Please try again.</p>
        ) : inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rewards in progress. Keep scanning!</p>
        ) : (
          <div className="space-y-3">
            {inProgress.map((i: any) => {
              const pct = Math.min(100, (i.stamps / i.stampsRequired) * 100);

              return (
                <button
                  key={`${i.restaurantId}-${i.rewardId}`}
                  onClick={() => navigate(`/programDetail/${i.restaurantId}`)}
                  className="w-full text-left bg-card border border-border rounded-3xl p-4 shadow-soft tap-scale hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                      style={{ backgroundColor: withOpacity(i.themeColor, 0.12) || "rgba(255,255,255,0.08)", color: i.themeColor }}
                    >
                      🎁
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-tight truncate">
                        {i.rewardDescription}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {i.restaurantName}
                        {i.location && (
                          <>
                            {" · "}
                            <MapPin className="inline h-3 w-3" />
                            {i.location}
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i.remaining} stamp{i.remaining === 1 ? "" : "s"} remaining
                      </p>
                    </div>
                  </div>

                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: i.themeColor,
                      }}
                    />
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