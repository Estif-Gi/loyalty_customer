import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Gift } from "lucide-react";
import { getRestaurant } from "@/lib/mockData";
import { useLoyalty, loyaltyStore } from "@/lib/store";
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
  const state = useLoyalty();
  const restaurant = id ? getRestaurant(id) : undefined;

  if (!restaurant) {
    return (
      <div className="p-6 text-center">
        <p>Restaurant not found.</p>
        <Button onClick={() => navigate("/restaurants")} className="mt-4">Back</Button>
      </div>
    );
  }

  const count = state.scans[restaurant.id] || 0;
  const nextReward = restaurant.rewards.find((r) => r.stampsRequired > count) || restaurant.rewards[restaurant.rewards.length - 1];

  const onRedeem = (rewardId: string, stampsRequired: number, title: string) => {
    if (count < stampsRequired) {
      toast.error(`Need ${stampsRequired - count} more stamps`);
      return;
    }
    loyaltyStore.redeem(restaurant.id, rewardId, stampsRequired);
    celebrate();
    toast.success(`${title} redeemed! Show this to staff. 🎉`);
  };

  return (
    <div className="pb-4">
      <div
        className="relative px-5 pt-6 pb-8 safe-top"
        style={{ background: `linear-gradient(160deg, hsl(${restaurant.color}) 0%, hsl(${restaurant.color} / 0.7) 100%)` }}
      >
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-6 text-white">
          <span className="text-5xl">{restaurant.emoji}</span>
          <h1 className="font-display text-4xl mt-2 leading-none">{restaurant.name}</h1>
          <p className="opacity-90 mt-1">{restaurant.tagline}</p>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        <StampCard restaurant={restaurant} count={count} goal={nextReward.stampsRequired} />

        <Button
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold tap-scale"
          onClick={() => navigate(`/menu/${restaurant.id}`)}
        >
          <BookOpen className="h-5 w-5 mr-2" /> View Menu
        </Button>

        <section>
          <h2 className="font-display text-2xl mb-3 mt-2">Rewards</h2>
          <div className="space-y-3">
            {restaurant.rewards.map((reward) => {
              const ready = count >= reward.stampsRequired;
              const remaining = Math.max(0, reward.stampsRequired - count);
              return (
                <div
                  key={reward.id}
                  className={`rounded-3xl p-4 border flex items-center gap-3 ${
                    ready ? "bg-gold/15 border-gold/40" : "bg-card border-border"
                  }`}
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${ready ? "gradient-gold" : "bg-secondary"}`}>
                    <Gift className={`h-6 w-6 ${ready ? "text-gold-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight">{reward.title}</p>
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
                          <AlertDialogTitle>Redeem {reward.title}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will use {reward.stampsRequired} stamps. Show the confirmation to staff at {restaurant.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onRedeem(reward.id, reward.stampsRequired, reward.title)} className="rounded-xl">
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
