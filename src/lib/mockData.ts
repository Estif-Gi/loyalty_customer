export type Reward = {
  id: string;
  title: string;
  stampsRequired: number;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  color: string; // hsl token
  rewards: Reward[];
  menu: MenuCategory[];
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: "ember-coffee",
    name: "Ember Coffee Co.",
    tagline: "Slow-roasted, hand-pulled.",
    emoji: "☕",
    color: "18 65% 42%",
    rewards: [
      { id: "r1", title: "Free Drip Coffee", stampsRequired: 5 },
      { id: "r2", title: "Free Specialty Latte", stampsRequired: 10 },
    ],
    menu: [
      {
        id: "drinks",
        name: "Drinks",
        items: [
          { id: "m1", name: "Drip Coffee", price: 3.5, description: "House blend, single origin" },
          { id: "m2", name: "Cortado", price: 4.5, description: "Double shot, steamed milk" },
          { id: "m3", name: "Vanilla Latte", price: 5.25, description: "Madagascar vanilla" },
          { id: "m4", name: "Cold Brew", price: 4.75, description: "18hr steeped" },
        ],
      },
      {
        id: "pastries",
        name: "Pastries",
        items: [
          { id: "m5", name: "Almond Croissant", price: 4.5 },
          { id: "m6", name: "Banana Bread", price: 3.75 },
        ],
      },
    ],
  },
  {
    id: "sienna-pizza",
    name: "Sienna Pizza",
    tagline: "Wood-fired Neapolitan.",
    emoji: "🍕",
    color: "12 70% 45%",
    rewards: [
      { id: "r3", title: "Free Margherita", stampsRequired: 8 },
      { id: "r4", title: "20% Off Next Visit", stampsRequired: 4 },
    ],
    menu: [
      {
        id: "pizzas",
        name: "Pizzas",
        items: [
          { id: "p1", name: "Margherita", price: 14, description: "San Marzano, mozzarella, basil" },
          { id: "p2", name: "Diavola", price: 17, description: "Spicy salami, chili oil" },
          { id: "p3", name: "Funghi", price: 16, description: "Wild mushrooms, truffle" },
        ],
      },
      {
        id: "starters",
        name: "Starters",
        items: [
          { id: "p4", name: "Burrata", price: 12 },
          { id: "p5", name: "Garlic Knots", price: 7 },
        ],
      },
    ],
  },
  {
    id: "copper-tacos",
    name: "Copper Tacos",
    tagline: "Street-style, agave-kissed.",
    emoji: "🌮",
    color: "28 80% 50%",
    rewards: [
      { id: "r5", title: "Free Taco", stampsRequired: 6 },
      { id: "r6", title: "Free Margarita", stampsRequired: 12 },
    ],
    menu: [
      {
        id: "tacos",
        name: "Tacos",
        items: [
          { id: "t1", name: "Al Pastor", price: 4.5, description: "Pineapple, onion, cilantro" },
          { id: "t2", name: "Carnitas", price: 4.5 },
          { id: "t3", name: "Baja Fish", price: 5.5, description: "Crispy cod, slaw, lime crema" },
        ],
      },
      {
        id: "sides",
        name: "Sides",
        items: [
          { id: "t4", name: "Elote", price: 5 },
          { id: "t5", name: "Chips & Guac", price: 8 },
        ],
      },
    ],
  },
];

export const getRestaurant = (id: string) => RESTAURANTS.find((r) => r.id === id);
