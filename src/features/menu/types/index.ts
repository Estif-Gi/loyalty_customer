export interface MenuItem {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface Menu {
  _id: string;
  restaurant: string;
  items: MenuItem[];
}
