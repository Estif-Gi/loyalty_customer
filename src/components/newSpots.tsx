import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback , useState} from "react";
import { MapPin, Phone, Sparkles } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Restaurant {
  _id: string;
  name: string;
  phone?: string;
  location?: string;
  themeColor?: string;
  loyaltyProgram?: string[];
}

// Skeleton card — extracted so it doesn't re-render
const SkeletonCard = () => (
  <div className="flex-none w-[220px] rounded-2xl border border-border overflow-hidden bg-card animate-pulse">
    <div className="h-[72px] bg-muted" />
    <div className="p-3 space-y-2">
      <div className="h-2.5 w-2/3 rounded bg-muted" />
      <div className="h-2.5 w-1/2 rounded bg-muted" />
      <div className="h-6 w-4/5 rounded-full bg-muted mt-1" />
    </div>
  </div>
);

// Individual card — memoized so the shelf doesn't repaint on parent re-renders
const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
  <div className="flex-none w-[220px] rounded-2xl border border-border overflow-hidden bg-card">
    <div
      className="h-[72px] flex items-end p-3"
      style={{ backgroundColor: restaurant.themeColor ?? "#f1efe8" }}
    >
      <div>
        <p className="text-[15px] font-medium text-white leading-tight">{restaurant.name}</p>
        {restaurant.location && (
          <p className="text-[11px] text-white/70 mt-0.5">{restaurant.location}</p>
        )}
      </div>
    </div>
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span className="truncate">{restaurant.location ?? "Location unavailable"}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Phone className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span className="truncate">{restaurant.phone ?? "Phone unavailable"}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        <Sparkles className="h-3 w-3 text-amber-400" />
        {restaurant.loyaltyProgram?.length
          ? `${restaurant.loyaltyProgram.length} program${restaurant.loyaltyProgram.length > 1 ? "s" : ""}`
          : "No program"}
      </div>
    </div>
  </div>
);

const NewSpots = () => {
  const shelfRef = useRef<HTMLDivElement>(null);

  // Only fetch when the section scrolls into view
  const sectionRef = useRef<HTMLElement>(null);
  const [enabled, setEnabled] = useState(false);

  const observe = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setEnabled(true); io.disconnect(); } },
      { rootMargin: "200px" }   // start fetching 200px before it's visible
    );
    io.observe(node);
  }, []);

  const { data: restaurants = [], isLoading, isError } = useQuery<Restaurant[]>({
    queryKey: ["restaurants"],
    queryFn: () => fetchApi("/restaurants") as Promise<Restaurant[]>,
    staleTime: 1000 * 60 * 5,   // treat data as fresh for 5 min — no refetch on tab focus
    gcTime: 1000 * 60 * 10,     // keep in cache for 10 min
    enabled,                     // only fires when section is near viewport
    select: useCallback(
      // strip fields the card doesn't need so store stays lean
      (data: Restaurant[]) =>
        data.map(({ _id, name, phone, location, themeColor, loyaltyProgram }) => ({
          _id, name, phone, location, themeColor, loyaltyProgram,
        })),
      []
    ),
  });

  return (
    <section ref={observe} className="space-y-3 pb-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">New spots</p>
          <h2 className="text-xl font-medium">Discover</h2>
        </div>
        {!isLoading && (
          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {restaurants.length} spots
          </span>
        )}
      </div>

      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load spots. Pull to refresh.
        </div>
      ) : (
        // Horizontal scroll shelf — no wrapping grid
        <div
          ref={shelfRef}
          className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : restaurants.map((r) => <RestaurantCard key={r._id} restaurant={r} />)
          }
        </div>
      )}
    </section>
  );
};

export default NewSpots;