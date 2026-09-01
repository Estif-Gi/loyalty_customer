import { fetchApi } from "@/lib/api";
import type { AuthResponse, User } from "../types";

export interface LoginParams {
  phone: string;
  password?: string;
}

export interface RegisterParams {
  name: string;
  phone: string;
  password?: string;
  role?: string;
}

export const authApi = {
  login: async (params: LoginParams): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify(params),
      skipAuth: true,
    });
  },

  register: async (params: RegisterParams): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify({ ...params, role: "customer" }),
      skipAuth: true,
    });
  },

  getProfile: async (): Promise<User> => {
    return fetchApi<User>("/users/profile");
  },
};
