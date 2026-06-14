// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface UserState {
  user: User;
  hasHydrated: boolean;
  setUser: (user: User) => void;
  setOnboarded: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

export const loyaltyStore = create<UserState>()(
  persist(
    (set) => ({
      user: {
        id: "",
        name: "",
        role: "customer",
        loyalTo: [],
        onboarded: false,
      },
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setOnboarded: (onboarded) =>
        set((state) => ({ user: { ...state.user, onboarded } })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () =>
        set({
          user: {
            id: "",
            name: "",
            role: "customer",
            loyalTo: [],
            onboarded: false,
          },
        }),
    }),
    {
      name: "loyalty-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
