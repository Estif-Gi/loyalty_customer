import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getRestaurant } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MenuView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurant = id ? getRestaurant(id) : undefined;
  const [activeCat, setActiveCat] = useState(restaurant?.menu[0]?.id);

  if (!restaurant) {
    return (
      <div className="p-6 text-center">
        <p>Menu not found.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Back</Button>
      </div>
    );
  }

  const category = restaurant.menu.find((c) => c.id === activeCat) || restaurant.menu[0];

  return (
    <div className="pb-4">
      <div
        className="px-5 pt-6 pb-8 safe-top relative"
        style={{ background: `linear-gradient(160deg, hsl(${restaurant.color}) 0%, hsl(${restaurant.color} / 0.7) 100%)` }}
      >
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-6 text-white">
          <p className="opacity-80 text-sm uppercase tracking-wider">Menu</p>
          <h1 className="font-display text-4xl mt-1 leading-none">{restaurant.name}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border">
        <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
          {restaurant.menu.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={cn(
                "px-4 h-9 rounded-full text-sm font-semibold whitespace-nowrap tap-scale transition-colors",
                activeCat === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 space-y-3">
        {category.items.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-3xl p-4 shadow-soft flex items-start gap-3">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: `hsl(${restaurant.color} / 0.12)` }}
            >
              {restaurant.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-lg leading-tight">{item.name}</p>
                <p className="font-semibold text-primary">${item.price.toFixed(2)}</p>
              </div>
              {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
