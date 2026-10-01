import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback, useState } from "react";
import {
  MapPin, Phone,
  Pizza, Coffee, Sandwich, Fish, Drumstick, Salad, IceCream, Utensils, Cookie, Soup,
  type LucideIcon,
} from "lucide-react";
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

/* ------------------------------------------------------------------ */
/* Background icon pattern (formerly components/CardPattern.tsx)       */
/* ------------------------------------------------------------------ */

const ICON_SETS: { match: string[]; icons: LucideIcon[] }[] = [
  { match: ["pizza", "italian"], icons: [Pizza, Utensils, Soup] },
  { match: ["coffee", "cafe", "beverage"], icons: [Coffee, Cookie, Coffee] },
  { match: ["burger", "american"], icons: [Sandwich, Drumstick, Utensils] },
  { match: ["sushi", "japanese"], icons: [Fish, Soup, Utensils] },
  { match: ["chicken"], icons: [Drumstick, Utensils, Drumstick] },
  { match: ["salad", "vegan"], icons: [Salad, Utensils, Salad] },
  { match: ["ice cream", "dessert"], icons: [IceCream, Cookie, IceCream] },
];
const DEFAULT_ICONS: LucideIcon[] = [Utensils, Soup, Cookie];

interface CardPatternProps {
  cuisine?: string;
  opacity?: number;
  className?: string;
  size?: number;
  rows?: number;
  cols?: number;
}

const CardPattern = ({
  cuisine = "",
  opacity = 0.2,
  className = "",
  size = 16,
  rows = 4,
  cols = 6,
}: CardPatternProps) => {
  const text = cuisine.toLowerCase();
  const icons = ICON_SETS.find((s) => s.match.some((m) => text.includes(m)))?.icons ?? DEFAULT_ICONS;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex flex-col justify-between py-2 ${className}`}
      style={{
        opacity,
        // fade toward the left so the logo/name stay clean
        WebkitMaskImage: "linear-gradient(to left, black 25%, transparent 85%)",
        maskImage: "linear-gradient(to left, black 25%, transparent 85%)",
      }}
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex justify-between"
          style={{ paddingLeft: r % 2 ? 22 : 6, paddingRight: r % 2 ? 6 : 22 }}
        >
          {Array.from({ length: cols }).map((_, c) => {
            const Icon = icons[(r + c) % icons.length];
            const rot = (r + c) % 2 ? 14 : -14;
            return (
              <Icon
                key={c}
                size={size}
                strokeWidth={1.5}
                style={{ transform: `rotate(${rot}deg)` }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Skeleton card                                                       */
/* ------------------------------------------------------------------ */

const SkeletonCard = () => (
  <div className="flex-none w-[170px] rounded-2xl overflow-hidden bg-card border border-border animate-pulse shadow-sm">
    <div className="h-[110px] bg-muted" />
    <div className="p-3 space-y-2">
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Wavy SVG divider                                                    */
/* ------------------------------------------------------------------ */

const WaveDivider = ({ color }: { color: string }) => {
  const wavePath = "M0,18 Q50,36 100,20 T200,18 T300,20 T400,18";

  return (
    <div className="relative -mt-px" style={{ height: 18 }}>
      <svg
        viewBox="0 0 200 36"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          d="M0,0 L0,18 Q50,36 100,20 T200,18 T300,20 T400,18 L400,0 Z"
          fill={color}
        />
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

/* ------------------------------------------------------------------ */
/* Cuisine emoji                                                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Restaurant card                                                     */
/* ------------------------------------------------------------------ */

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  const themeColor = restaurant.themeColor ?? "#c0392b";
  const icon = restaurant.icon ?? getCuisineIcon(restaurant.name, restaurant.cuisineType);

  // Split name into owner prefix + main name (e.g. "estif's" + "Pizza Palace")
  const nameParts = restaurant.name.match(/^(\S+'s)\s+(.+)$/i);
  const ownerName = nameParts?.[1] ?? null;
  const mainName = nameParts?.[2] ?? restaurant.name;
  const nameLength = mainName.length;

  const nameClass =
    nameLength > 28 ? "text-white text-[12px]" :
    nameLength > 20 ? "text-white text-[13px]" :
    nameLength > 12 ? "text-white text-[15px]" :
    "text-white text-[17px]";
  const ownerClass =
    ownerName && ownerName.length > 12
      ? "text-white/80 text-[10px] font-normal"
      : "text-white/80 text-[11px] font-normal";

  return (
    <div className="flex-none w-[190px] rounded-2xl overflow-hidden bg-white shadow-md">
      {/* Colored header */}
      <div
        className="relative flex px-3 gap-2 pt-3 pb-0 overflow-hidden"
        style={{ backgroundColor: themeColor, minHeight: 100 }}
      >
        {/* Background icon pattern */}
        <CardPattern
          cuisine={restaurant.cuisineType ?? restaurant.name}
          opacity={0.2}
          className="text-white"
        />

        {/* Circular icon */}
        <div className="relative z-10 w-11 h-11 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center mb-2 shrink-0">
          <span className="text-xl">{icon}</span>
        </div>

        {/* Thin divider line */}
        <div className="relative z-10 h-6 w-[2px] bg-white/40 my-1.5 shrink-0" />

        {/* Name */}
        <div className="relative z-10 mb-1 flex-1 min-w-0">
          {ownerName && <p className={ownerClass}>{ownerName}</p>}
          <p className={`${nameClass} font-bold leading-tight`}>{mainName}</p>
        </div>

        {/* Cuisine type */}
        {restaurant.cuisineType && (
          <p className="absolute z-10 bottom-1.5 left-3 text-[#F5C842] text-[11px] font-medium">
            {restaurant.cuisineType}
          </p>
        )}
      </div>

      {/* Wave transition */}
      <WaveDivider color={themeColor} />

      {/* White body */}
      <div className="px-3 pb-3 space-y-2 bg-white">
        {/* Location */}
        <div className="flex items-start gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${themeColor}18` }}
          >
            <MapPin className="w-3 h-3" style={{ color: themeColor }} />
          </div>
          <p className="text-[11px] text-gray-600 leading-tight pt-1 line-clamp-2">
            {restaurant.location ?? "Location unavailable"}
          </p>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${themeColor}18` }}
          >
            <Phone className="w-3 h-3" style={{ color: themeColor }} />
          </div>
          <p className="text-[11px] text-gray-600">
            {restaurant.phone ?? "Phone unavailable"}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* NewSpots shelf                                                      */
/* ------------------------------------------------------------------ */

const NewSpots = () => {
  const shelfRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  const observe = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnabled(true);
          io.disconnect();
        }
      },
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
          className="flex gap-3 overflow-x-auto pb-3 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : restaurants.map((r) => <RestaurantCard key={r._id} restaurant={r} />)}
        </div>
      )}
    </section>
  );
};

export default NewSpots;