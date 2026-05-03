import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { ArrowLeft, BookOpen, Gift } from "lucide-react";
import { StampCard } from "@/components/StampCard";
import { Button } from "@/components/ui/button";
import { celebrate } from "@/lib/confetti";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchApi("/users/profile"),
  });

  const { data: restaurant, isLoading: isResLoading } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => fetchApi(`/restaurants/${id}`, { skipAuth: true }),
    enabled: !!id,
  });

  const { data: loyaltyProgram, isLoading: isLoyaltyLoading } = useQuery({
    queryKey: ["loyalty", id],
    queryFn: () => fetchApi(`/loyalty/restaurant/${id}`).catch(() => null),
    enabled: !!id,
  });

  if (isResLoading || isLoyaltyLoading) {
    return <div className="p-5 safe-top flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!restaurant) {
    return (
      <div className="p-6 text-center">
        <p>Restaurant not found.</p>
        <Button onClick={() => navigate("/restaurants")} className="mt-4">Back</Button>
      </div>
    );
  }

  const loyalTo = profile?.loyalTo || [];
  const loyaltyData = loyalTo.find((l: any) => l.resID === restaurant._id);
  const count = loyaltyData?.stamps || 0;
  
  const rewards = loyaltyProgram?.rewards || [];
  const nextReward = rewards.find((r: any) => r.stampsRequired > count) || rewards[rewards.length - 1] || { stampsRequired: 10 };

  const onRedeem = (rewardId: string, stampsRequired: number, title: string) => {
    if (count < stampsRequired) {
      toast.error(`Need ${stampsRequired - count} more stamps`);
      return;
    }
    // Note: Since there is no redeem endpoint in the backend currently,
    // we simulate redemption success visually.
    celebrate();
    toast.success(`${title} redeemed! Show this to staff. 🎉`);
  };

  return (
    <div className="pb-4">
      <div
        className="relative px-5 pt-6 pb-8 safe-top"
        style={{ background: `linear-gradient(160deg, ${restaurant.themeColor || '#184565'} 0%, ${restaurant.themeColor || '#184565'}b3 100%)` }}
      >
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-6 text-white">
          <span className="text-5xl">{restaurant.emoji || "🍽️"}</span>
          <h1 className="font-display text-4xl mt-2 leading-none">{restaurant.name}</h1>
          <p className="opacity-90 mt-1">{restaurant.location}</p>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        <StampCard restaurant={restaurant} count={count} goal={nextReward.stampsRequired} />

        <Button
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold tap-scale"
          onClick={() => navigate(`/menu/${restaurant._id}`)}
        >
          <BookOpen className="h-5 w-5 mr-2" /> View Menu
        </Button>

        <section>
          <h2 className="font-display text-2xl mb-3 mt-2">Rewards</h2>
          {rewards.length === 0 && (
            <p className="text-muted-foreground text-sm">No rewards setup for this restaurant yet.</p>
          )}
          <div className="space-y-3">
            {rewards.map((reward: any) => {
              const ready = count >= reward.stampsRequired;
              const remaining = Math.max(0, reward.stampsRequired - count);
              return (
                <div
                  key={reward._id || reward.rewardDescription}
                  className={`rounded-3xl p-4 border flex items-center gap-3 ${
                    ready ? "bg-gold/15 border-gold/40" : "bg-card border-border"
                  }`}
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${ready ? "gradient-gold" : "bg-secondary"}`}>
                    <Gift className={`h-6 w-6 ${ready ? "text-gold-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight">{reward.rewardDescription}</p>
                    <p className="text-xs text-muted-foreground">
                      {ready ? "Ready to redeem" : `${remaining} more stamp${remaining === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {ready ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="rounded-xl tap-scale">Redeem</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Redeem {reward.rewardDescription}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will use {reward.stampsRequired} stamps. Show the confirmation to staff at {restaurant.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onRedeem(reward._id, reward.stampsRequired, reward.rewardDescription)} className="rounded-xl">
                            Yes, redeem
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">{count}/{reward.stampsRequired}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
