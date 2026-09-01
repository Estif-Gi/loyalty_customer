export interface LoyalTo {
  resID: string;
  resName: string;
  stamps: number;
  _id: string;
}

export interface User {
  id: string;
  _id?: string;
  phone?: string;
  name?: string;
  email?: string;
  role?: string;
  loyalTo?: LoyalTo[];
  onboarded?: boolean;
}

export type AuthUser = User;

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
