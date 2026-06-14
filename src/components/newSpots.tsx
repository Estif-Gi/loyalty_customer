import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback, useState } from "react";
import { MapPin, Phone, Sparkles } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Restaurant {
  _id: string;
  name: string;
  phone?: string;
  location?: string;
  themeColor?: string;
  cuisineType?: string;
  loyaltyProgram?: string[];
  icon?: string; // emoji or icon identifier
}

// Skeleton card
const SkeletonCard = () => (
  <div className="flex-none w-[200px] rounded-3xl overflow-hidden bg-card border border-border animate-pulse shadow-sm">
    <div className="h-[180px] bg-muted" />
    <div className="p-4 space-y-3">
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="h-8 w-full rounded-full bg-muted mt-2" />
    </div>
  </div>
);

// Wavy SVG divider
const WaveDivider = ({ color }: { color: string }) => {
  const wavePath = "M0,18 Q50,36 100,20 T200,18 T300,20 T400,18";

  return (
    <div className="relative -mt-px" style={{ height: 26 }}>
      <svg
        viewBox="0 0 200 36"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          d={`M0,0 L0,18 Q50,36 100,20 T200,18 T300,20 T400,18 L400,0 Z`}
          fill={color}
        />
        {/* <path
          d={`M0,0 L0,18 Q50,36 100,20 T200,18 T300,20 T400,18 L400,0 Z`}
          fill="#fff"
        /> */}
        {/* Stroke using opacity — works with any CSS color format */}
        <path
          d={wavePath}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          opacity={0.4}
        />
      </svg>
    </div>
  );
};
// Derive a cuisine icon emoji from the name/type
const getCuisineIcon = (name: string, cuisineType?: string): string => {
  const text = (cuisineType ?? name).toLowerCase();
  if (text.includes("pizza") || text.includes("italian")) return "🍕";
  if (text.includes("coffee") || text.includes("cafe") || text.includes("beverage")) return "☕";
  if (text.includes("burger") || text.includes("american")) return "🍔";
  if (text.includes("sushi") || text.includes("japanese")) return "🍣";
  if (text.includes("taco") || text.includes("mexican")) return "🌮";
  if (text.includes("chicken")) return "🍗";
  if (text.includes("salad") || text.includes("vegan")) return "🥗";
  if (text.includes("ice cream") || text.includes("dessert")) return "🍦";
  return "🍽️";
};

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  const themeColor = restaurant.themeColor ?? "#c0392b";
  const icon = restaurant.icon ?? getCuisineIcon(restaurant.name, restaurant.cuisineType);
  const hasProgram = (restaurant.loyaltyProgram?.length ?? 0) > 0;

  // Split name into owner prefix + main name (e.g. "estif's" + "Pizza Palace")
  const nameParts = restaurant.name.match(/^(\S+'s)\s+(.+)$/i);
  const ownerName = nameParts?.[1] ?? null;
  const mainName = nameParts?.[2] ?? restaurant.name;

  return (
    <div
      className="flex-none w-[230px] rounded-3xl overflow-hidden bg-white shadow-md"
      // style={{ boxShadow: `0 4px 20px ${themeColor}28` }}
    >
      {/* Colored header */}
      <div
        className="relative px-4 pt-4 pb-0"
        style={{ backgroundColor: themeColor, minHeight: 140 }}
      >
        {/* Circular icon */}
        <div
          className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center mb-3"
        >
          <span className="text-2xl">{icon}</span>
        </div>

        {/* Name */}
        <div className="mb-1">
          {ownerName && (
            <p className="text-white/80 text-[13px] font-normal leading-tight">{ownerName}</p>
          )}
          <p className="text-white text-[20px] font-bold leading-tight">{mainName}</p>
        </div>

        {/* Thin divider line */}
        <div className="w-8 h-[2px] bg-white/40 my-2" />

        {/* Cuisine type */}
        {restaurant.cuisineType && (
          <p className="text-[#F5C842] text-[13px] font-medium mb-3">{restaurant.cuisineType}</p>
        )}
      </div>

      {/* Wave transition */}
      <WaveDivider color={themeColor} />

      {/* White body */}
      <div className="px-4 pb-4 space-y-3 bg-white">
        {/* Location */}
        <div className="flex items-start gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${themeColor}18` }}
          >
            <MapPin className="w-4 h-4" style={{ color: themeColor }} />
          </div>
          <p className="text-[12px] text-gray-600 leading-tight pt-1">
            {restaurant.location ?? "Location unavailable"}
          </p>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${themeColor}18` }}
          >
            <Phone className="w-4 h-4" style={{ color: themeColor }} />
          </div>
          <p className="text-[12px] text-gray-600">
            {restaurant.phone ?? "Phone unavailable"}
          </p>
        </div>

        {/* Loyalty badge */}
        {/* <div
          className="flex items-center gap-2 rounded-full px-3 py-2 mt-1"
          style={{ backgroundColor: `${themeColor}15` }}
        >
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: themeColor }} />
          <span className="text-[12px] font-medium" style={{ color: themeColor }}>
            {hasProgram
              ? `${restaurant.loyaltyProgram!.length} program${restaurant.loyaltyProgram!.length > 1 ? "s" : ""} available`
              : "No program available"}
          </span>
        </div> */}
      </div>
    </div>
  );
};

const NewSpots = () => {
  const shelfRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  const observe = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setEnabled(true); io.disconnect(); } },
      { rootMargin: "200px" }
    );
    io.observe(node);
  }, []);

  const { data: restaurants = [], isLoading, isError } = useQuery<Restaurant[]>({
    queryKey: ["restaurants"],
    queryFn: () => fetchApi("/restaurants") as Promise<Restaurant[]>,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled,
    select: useCallback(
      (data: Restaurant[]) =>
        data.map(({ _id, name, phone, location, themeColor, loyaltyProgram, cuisineType, icon }) => ({
          _id, name, phone, location, themeColor, loyaltyProgram, cuisineType, icon,
        })),
      []
    ),
  });

  return (
    <section ref={observe} className="space-y-3 pb-4">
      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load spots. Pull to refresh.
        </div>
      ) : (
        <div
          ref={shelfRef}
          className="flex gap-4 overflow-x-auto pb-3 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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