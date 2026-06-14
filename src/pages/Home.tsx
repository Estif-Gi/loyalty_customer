import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { StampCard } from "@/components/StampCard";
import { Sparkles } from "lucide-react";
import { loyaltyStore } from "@/lib/store";
import NewSpots from "@/components/newSpots";

export default function Home() {
  const navigate = useNavigate();

  const profile = loyaltyStore((state) => state.user);

  if (!profile ) {
    navigate("/onboarding", { replace: true });
    return null;
  }

  const loyalTo = profile.loyalTo || [];

  // Build cards directly from the user payload returned during authentication.
  const visited = loyalTo.map((l: any) => {
    return {
      _id: l.resID,
      name: l.resName || "Unknown Spot",
      emoji: "🍽️",
      themeColor: "",
      location: "",
      stamps: l.stamps,
    };
  });

  // Sort by stamps descending and take top 2
  const sortedVisited = visited.sort((a, b) => b.stamps - a.stamps);
  const featured = sortedVisited.slice(0, 2);
  const totalStamps = visited.reduce((acc: number, curr: any) => acc + curr.stamps, 0);
  return (
    <div className="px-5 pt-8 pb-4 safe-top">
      <header className="mb-6">
        <p className="text-muted-foreground text-sm">Hello{profile.name ? `, ${profile.name}` : ""}</p>
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

      {/* Featured */}
      {featured.length > 0 ? (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl">Your Cards</h2>
            <Link to="/restaurants" className="text-sm text-primary font-medium">See all</Link>
          </div>
          <div className="space-y-3">
            {featured.map((r: any) => {
              // In a real app, you'd fetch the loyalty program to get the goal. Hardcoding to 10 for display if not found.
              const goal = 10;
              return (
                <button key={r._id} onClick={() => navigate(`/restaurant/${r._id}`)} className="w-full text-left tap-scale">
                  <StampCard restaurant={r} count={r.stamps} goal={goal} compact />
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mb-6">
          <div className="rounded-3xl overflow-hidden bg-card border border-border shadow-soft p-5 flex  gap- flex-col items-end">
            <p className="text-xl uppercase font-bold mb-3 flex self-start">Start earning rewards!</p>
            <div className="flex">
              <div className="flex-1 ">
                <h2 className="text-[14px] mb-4">Scan at partner locations to collect stamps and unlock exciting rewards.</h2>
                <button
                  type="button"
                  onClick={() => navigate("/scan")}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
                >
                  Scan Now
                </button>
              </div>


              <div className="flex-1 max-w-sm ">
                <img
                  src="home%20page%20img.webp"
                  alt="Scan now"
                  className="w-full rounded-[2rem] object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Discover */}
      <section>
        <h2 className="font-display text-2xl ">Discover Spots</h2>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">New spots</p>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 scrollbar-hide">
          <NewSpots />
        </div>
      </section>
    </div>
  );
}
