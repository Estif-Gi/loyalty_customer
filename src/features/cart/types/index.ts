export interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface CartScope {
  restaurantId: string;
  orderSessionId: string;
}
