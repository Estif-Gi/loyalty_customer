import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface CardPatternProps {
  cuisine?: string;
  className?: string;
  opacity?: number;
  /**
   * Set to "image" to use the direct PNG extraction of the user pattern,
   * or "vector" for resolution-independent SVG doodles. Defaults to "vector".
   */
  variant?: "vector" | "image";
}

/**
 * Determine cuisine theme category based on restaurant name or cuisineType string.
 */
export function getPatternCuisine(cuisine?: string): "pizza" | "coffee" | "burger" | "food" {
  if (!cuisine) return "pizza"; // Default to pizza doodle as requested
  const text = cuisine.toLowerCase();
  if (text.includes("pizza") || text.includes("italian") || text.includes("pasta") || text.includes("pie")) {
    return "pizza";
  }
  if (text.includes("coffee") || text.includes("cafe") || text.includes("tea") || text.includes("bakery") || text.includes("dessert")) {
    return "coffee";
  }
  if (text.includes("burger") || text.includes("diner") || text.includes("fast") || text.includes("grill") || text.includes("bbq")) {
    return "burger";
  }
  return "pizza"; // Fallback to the user's pizza/food pattern
}

export const CardPattern: React.FC<CardPatternProps> = ({
  cuisine,
  className,
  opacity = 0.16,
  variant = "vector",
}) => {
  const uniqueId = useId().replace(/:/g, "_");
  const patternId = `card-pattern-${uniqueId}`;
  const category = getPatternCuisine(cuisine);

  if (variant === "image") {
    return (
      <div
        className={cn(
          "absolute inset-0 pointer-events-none select-none bg-repeat",
          className
        )}
        style={{
          backgroundImage: "url('/images/pattern-pizza.png')",
          backgroundSize: "170px 170px",
          opacity,
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none select-none text-white",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={patternId}
          width="190"
          height="190"
          patternUnits="userSpaceOnUse"
        >
          {category === "pizza" && (
            /* Pizza & Italian Doodle Pattern matching the user's reference image */
            <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Top-Right Pizza Slice (angled downward) */}
              <g transform="translate(110, 10) rotate(18) scale(0.65)">
                {/* Crust arc */}
                <path d="M 85,20 A 68,68 0 0,1 125,70" strokeWidth="6" />
                {/* Triangular slice */}
                <path d="M 15,85 L 85,20 A 68,68 0 0,1 125,70 L 15,85 Z" strokeWidth="2.8" />
                {/* Pepperoni toppings */}
                <circle cx="68" cy="55" r="6.5" strokeWidth="2.2" />
                <circle cx="95" cy="48" r="6.5" strokeWidth="2.2" />
                <circle cx="78" cy="72" r="5.5" strokeWidth="2.2" />
              </g>

              {/* Bottom-Left Pizza Slice (angled upward) */}
              <g transform="translate(-30, 70) rotate(-28) scale(0.72)">
                <path d="M 85,20 A 68,68 0 0,1 125,70" strokeWidth="6" />
                <path d="M 15,85 L 85,20 A 68,68 0 0,1 125,70 L 15,85 Z" strokeWidth="2.8" />
                <circle cx="65" cy="55" r="7" strokeWidth="2.2" />
                <circle cx="92" cy="50" r="6" strokeWidth="2.2" />
                <circle cx="75" cy="72" r="6" strokeWidth="2.2" />
              </g>

              {/* Top-Left Whole Pizza Pie */}
              <g transform="translate(51, 79) scale(0.58)">
                <circle cx="50" cy="50" r="44" strokeWidth="4.5" />
                <circle cx="50" cy="50" r="35" strokeWidth="2.2" />
                <circle cx="50" cy="30" r="6" strokeWidth="2.2" />
                <circle cx="68" cy="45" r="6" strokeWidth="2.2" />
                <circle cx="62" cy="65" r="6" strokeWidth="2.2" />
                <circle cx="38" cy="65" r="6" strokeWidth="2.2" />
                <circle cx="35" cy="45" r="6" strokeWidth="2.2" />
                <circle cx="50" cy="50" r="3.5" strokeWidth="1.8" />
              </g>

              {/* Center-Right Calzone / Folded Turnover */}
              <g transform="translate(112, 92) rotate(-8) scale(0.58)">
                {/* Curved pocket */}
                <path
                  d="M 12,48 C 12,18 42,6 74,15 C 96,22 100,45 92,60 C 78,74 44,70 12,48 Z"
                  strokeWidth="3.8"
                />
                {/* Crimped seam dashes */}
                <path
                  d="M 15,48 C 35,60 62,67 92,60"
                  strokeWidth="2.8"
                  strokeDasharray="4,4"
                />
                {/* Steam slits */}
                <path d="M 44,28 L 54,34 M 56,42 L 66,48 M 34,38 L 44,44" strokeWidth="2.4" />
              </g>

              {/* Basil Leaves */}
              <g transform="translate(82, 40) rotate(35) scale(0.52)">
                <path d="M 8,42 C 4,18 26,4 42,4 C 42,26 30,44 8,42 Z" strokeWidth="2.8" />
                <path d="M 8,42 C 22,28 32,15 42,4" strokeWidth="2" />
              </g>
              <g transform="translate(172, 85) rotate(-45) scale(0.48)">
                <path d="M 8,42 C 4,18 26,4 42,4 C 42,26 30,44 8,42 Z" strokeWidth="2.8" />
                <path d="M 8,42 C 22,28 32,15 42,4" strokeWidth="2" />
              </g>

              {/* Small Decorative Dots & Rings */}
              <circle cx="95" cy="22" r="4.5" strokeWidth="2.2" />
              <circle cx="102" cy="85" r="2.8" fill="currentColor" stroke="none" />
              <circle cx="75" cy="148" r="4.2" strokeWidth="2" />
              <circle cx="92" cy="172" r="2.5" fill="currentColor" stroke="none" />
              <circle cx="172" cy="25" r="3" strokeWidth="1.8" />
              <circle cx="180" cy="155" r="4" strokeWidth="2" />
              <circle cx="10" cy="175" r="2" fill="currentColor" stroke="none" />
              <circle cx="82" cy="120" r="2.2" fill="currentColor" stroke="none" />
              <circle cx="160" cy="180" r="2.5" fill="currentColor" stroke="none" />
            </g>
          )}

          {category === "coffee" && (
            /* Cafe & Coffee Doodle Pattern */
            <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Coffee Cup & Saucer */}
              <g transform="translate(18, 20) scale(0.65)">
                <path d="M 15,25 L 18,55 C 19,65 35,70 50,70 C 65,70 81,65 82,55 L 85,25 Z" strokeWidth="3" />
                <path d="M 83,32 C 95,32 98,48 82,52" strokeWidth="3" />
                {/* Saucer */}
                <path d="M 5,72 C 25,82 75,82 95,72" strokeWidth="3.5" />
                {/* Steam swirls */}
                <path d="M 38,18 C 35,12 40,8 37,2" strokeWidth="2" />
                <path d="M 50,18 C 47,12 52,8 49,2" strokeWidth="2" />
                <path d="M 62,18 C 59,12 64,8 61,2" strokeWidth="2" />
              </g>

              {/* Takeaway Coffee Cup */}
              <g transform="translate(115, 80) rotate(12) scale(0.6)">
                <path d="M 20,25 L 26,80 C 27,86 45,88 54,88 C 63,88 81,86 82,80 L 88,25 Z" strokeWidth="3" />
                <path d="M 16,25 L 92,25 L 90,16 L 18,16 Z" strokeWidth="3" />
                {/* Sleeve band */}
                <path d="M 23,42 L 85,42 M 25,62 L 83,62" strokeWidth="2.2" />
              </g>

              {/* Coffee Bean 1 */}
              <g transform="translate(125, 25) rotate(-25) scale(0.65)">
                <ellipse cx="25" cy="18" rx="18" ry="12" strokeWidth="3" />
                <path d="M 10,18 Q 25,8 25,18 Q 25,28 40,18" strokeWidth="2.2" />
              </g>

              {/* Coffee Bean 2 */}
              <g transform="translate(40, 120) rotate(45) scale(0.55)">
                <ellipse cx="25" cy="18" rx="18" ry="12" strokeWidth="3" />
                <path d="M 10,18 Q 25,8 25,18 Q 25,28 40,18" strokeWidth="2.2" />
              </g>

              {/* Croissant */}
              <g transform="translate(85, 140) rotate(-15) scale(0.55)">
                <path d="M 10,35 C 15,10 55,10 70,35 C 55,30 25,30 10,35 Z" strokeWidth="3" />
                <path d="M 25,23 C 35,35 45,35 55,23" strokeWidth="2.2" />
              </g>

              {/* Sparkles and dots */}
              <circle cx="95" cy="30" r="3" strokeWidth="2" />
              <circle cx="90" cy="95" r="2.5" fill="currentColor" stroke="none" />
              <circle cx="165" cy="155" r="3.5" strokeWidth="2" />
              <circle cx="20" cy="100" r="2" fill="currentColor" stroke="none" />
              <circle cx="175" cy="45" r="2.5" fill="currentColor" stroke="none" />
            </g>
          )}

          {category === "burger" && (
            /* Burger & Diner Pattern */
            <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Burger */}
              <g transform="translate(20, 25) scale(0.65)">
                {/* Top bun */}
                <path d="M 10,40 C 10,12 75,12 75,40 Z" strokeWidth="3.5" />
                {/* Sesame seeds */}
                <circle cx="32" cy="24" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="48" cy="20" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="60" cy="28" r="1.5" fill="currentColor" stroke="none" />
                {/* Patty & Cheese */}
                <path d="M 6,46 L 79,46" strokeWidth="3.8" />
                <path d="M 12,46 L 25,56 L 38,46" strokeWidth="2.5" />
                {/* Bottom bun */}
                <path d="M 12,54 C 12,65 73,65 73,54 Z" strokeWidth="3" />
              </g>

              {/* French Fries */}
              <g transform="translate(115, 20) rotate(15) scale(0.6)">
                {/* Fries carton */}
                <path d="M 18,40 L 25,82 L 65,82 L 72,40 Z" strokeWidth="3" />
                <path d="M 30,40 C 40,48 50,48 60,40" strokeWidth="2.5" />
                {/* Fries sticks */}
                <path d="M 26,40 L 26,18 M 36,42 L 36,10 M 46,43 L 46,14 M 56,42 L 56,12 M 64,40 L 64,22" strokeWidth="4" />
              </g>

              {/* Soda Cup with Straw */}
              <g transform="translate(30, 95) rotate(-10) scale(0.6)">
                {/* Cup */}
                <path d="M 22,30 L 28,82 C 29,88 47,90 54,90 C 61,90 79,88 80,82 L 86,30 Z" strokeWidth="3" />
                <path d="M 18,30 L 90,30" strokeWidth="3.5" />
                {/* Straw */}
                <path d="M 54,30 L 54,12 L 66,5" strokeWidth="3.2" />
              </g>

              {/* Hotdog */}
              <g transform="translate(100, 120) rotate(-20) scale(0.58)">
                <rect x="15" y="25" width="70" height="28" rx="14" strokeWidth="3" />
                {/* Sausage and mustard squiggle */}
                <path d="M 8,39 L 92,39" strokeWidth="4.5" />
                <path d="M 22,38 Q 30,32 38,38 Q 46,44 54,38 Q 62,32 70,38 Q 78,44 86,38" strokeWidth="2.2" />
              </g>

              {/* Decorative rings & sparkles */}
              <circle cx="100" cy="85" r="3.5" strokeWidth="2" />
              <circle cx="165" cy="95" r="2.5" fill="currentColor" stroke="none" />
              <circle cx="20" cy="85" r="2" fill="currentColor" stroke="none" />
              <circle cx="175" cy="165" r="3.5" strokeWidth="2" />
            </g>
          )}

          {category === "food" && (
            /* Universal Food Mix Pattern */
            <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Crossed Cutlery */}
              <g transform="translate(25, 25) scale(0.65)">
                <path d="M 15,15 L 65,65" strokeWidth="3" />
                <path d="M 65,15 L 15,65" strokeWidth="3" />
                <path d="M 10,12 C 8,20 18,25 24,18 Z" strokeWidth="2.5" />
                <path d="M 58,10 L 58,22 M 64,10 L 64,22 M 70,10 L 70,22" strokeWidth="2.5" />
              </g>

              {/* Pizza Slice */}
              <g transform="translate(115, 20) rotate(20) scale(0.6)">
                <path d="M 85,20 A 68,68 0 0,1 125,70" strokeWidth="6" />
                <path d="M 15,85 L 85,20 A 68,68 0 0,1 125,70 L 15,85 Z" strokeWidth="2.8" />
                <circle cx="68" cy="55" r="6" strokeWidth="2.2" />
                <circle cx="95" cy="48" r="6" strokeWidth="2.2" />
              </g>

              {/* Serving Cloche / Plate */}
              <g transform="translate(25, 110) scale(0.6)">
                <path d="M 15,50 C 15,22 75,22 75,50 Z" strokeWidth="3" />
                <path d="M 10,52 L 80,52" strokeWidth="3.5" />
                <circle cx="45" cy="18" r="4" strokeWidth="2.5" />
              </g>

              {/* Chef Hat */}
              <g transform="translate(115, 105) rotate(-10) scale(0.6)">
                <path d="M 22,55 L 68,55 L 65,70 L 25,70 Z" strokeWidth="2.8" />
                <path d="M 22,55 C 8,45 15,25 30,30 C 35,15 55,15 60,30 C 75,25 82,45 68,55 Z" strokeWidth="3" />
              </g>

              {/* Sparkles & dots */}
              <circle cx="95" cy="30" r="3" strokeWidth="2" />
              <circle cx="95" cy="95" r="2.5" fill="currentColor" stroke="none" />
              <circle cx="165" cy="85" r="3.5" strokeWidth="2" />
              <circle cx="20" cy="95" r="2" fill="currentColor" stroke="none" />
            </g>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

export default CardPattern;
