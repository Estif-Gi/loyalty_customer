export interface Restaurant {
  _id: string;
  id?: string;
  name: string;
  logoURL?: string;
  location?: string;
  themeColor?: string;
  emoji?: string;
  orderingEnabled?: boolean;
  orderingRadiusMeters?: number;
  latitude?: number;
  longitude?: number;
}
