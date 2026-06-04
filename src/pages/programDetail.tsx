import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Gift, Sparkles, Ticket } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { withOpacity } from "@/lib/utils";

type Reward = {
  _id: string;
  stampsRequired: number;
  rewardDescription: string;
};

type Program = {
  _id: string;
  restaurant: string;
  rewards: Reward[];
};

type RestaurantProgramResponse = {
  themeColor?: string;
  name?: string;
  location?: string;
  programs?: Program[];
};

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchApi("/users/profile"),
  });

  const {
    data: programResponse,
    isLoading,
    isError,
    error,
  } = useQuery<RestaurantProgramResponse | null>({
    queryKey: ["program-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetchApi(`/loyalty/restaurant/${id}`);
      if (!response) return null;
      if (Array.isArray(response)) {
        return { programs: response as Program[] };
      }
      return response as RestaurantProgramResponse;
    },
  });

  const loyaltyProgram = useMemo(
    () => programResponse?.programs?.[0] ?? null,
    [programResponse]
  );

  const rewards = useMemo(
    () =>
      [...(loyaltyProgram?.rewards || [])].sort(
        (a, b) => a.stampsRequired - b.stampsRequired
      ),
    [loyaltyProgram]
  );

  const count = useMemo(() => {
    const loyalTo = profile?.loyalTo || [];
    const loyaltyData =
      loyalTo.find((l: any) => l.resID === id) ||
      loyalTo.find((l: any) => l.resID === loyaltyProgram?.restaurant);
    return loyaltyData?.stamps || 0;
  }, [profile, id, loyaltyProgram]);

  if (!id) {
    return (
      <div className="p-6 safe-top">
        <p className="text-sm text-muted-foreground">Invalid restaurant id.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 safe-top">
        <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 safe-top">
        <div className="rounded-3xl bg-destructive/10 border border-destructive/30 p-6">
          <p className="font-semibold mb-1">Could not load this loyalty program</p>
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message || "Something went wrong. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!loyaltyProgram) {
    return (
      <div className="p-6 safe-top">
        <div className="rounded-3xl bg-card border border-border p-6">
          <p className="font-semibold">Program not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            There is no loyalty program configured for this restaurant yet.
          </p>
        </div>
      </div>
    );
  }

  const programThemeColor = programResponse?.themeColor || "#184565";

  return (
    <div className="pb-4">
      <div
        className="px-5 pt-6 pb-7 safe-top text-primary-foreground"
        style={{
          background: `linear-gradient(140deg, ${programThemeColor} 0%, ${withOpacity(programThemeColor, 0.8)} 100%)`,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center tap-scale"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">Loyalty Program</p>
          <h1 className="font-display text-4xl leading-none mt-2">
            {programResponse?.name || "Earn & Redeem Rewards"}
          </h1>
          <p className="text-sm mt-2 opacity-90"><span className="font-bold">Address:</span> 
            {programResponse?.location || "Collect stamps and unlock better perks."}
          </p>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Total Rewards</p>
              <p className="font-display text-3xl leading-none mt-1">{rewards.length}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Program Status</p>
              <p className="font-semibold mt-1">Active</p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="font-display text-2xl mb-3">Available Rewards</h2>
          {rewards.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                No rewards have been set up for this program yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward, index) => {
                const pct =
                  reward.stampsRequired > 0
                    ? Math.min(100, (count / reward.stampsRequired) * 100)
                    : 0;
                return (
                  <div
                    key={reward._id}
                    className="rounded-3xl border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold leading-tight">{reward.rewardDescription}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Ticket className="h-3.5 w-3.5" />
                          <span>{reward.stampsRequired} stamps required</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold rounded-full bg-secondary px-2.5 py-1">
                        Tier {index + 1}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {count}/{reward.stampsRequired} stamps
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}