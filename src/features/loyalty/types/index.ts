export interface Reward {
  _id: string;
  stampsRequired: number;
  rewardDescription: string;
}

export interface LoyaltyProgram {
  _id: string;
  restaurant: string;
  rewards: Reward[];
}

export interface RestaurantLoyaltyResponse {
  themeColor?: string;
  name?: string;
  location?: string;
  programs?: LoyaltyProgram[];
}
