export interface SessionRestaurant {
  id: string;
  _id?: string;
  name: string;
  logoURL?: string;
  themeColor?: string;
}

export interface SessionTable {
  id: string;
  _id?: string;
  name: string;
  code: string;
}

export interface OrderSession {
  id: string;
  _id?: string;
  restaurant: SessionRestaurant;
  table: SessionTable;
  expiresAt: string;
  lastVerifiedAt?: string;
}

export interface OrderSessionResponse {
  success: boolean;
  data: {
    session: OrderSession;
  };
  message?: string;
}

export interface VerifyLocationResponse {
  success: boolean;
  message: string;
  data: {
    distanceMeters: number;
    lastVerifiedAt: string;
  };
}
