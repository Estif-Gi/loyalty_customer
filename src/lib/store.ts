// Lightweight reactive localStorage store for loyalty state
import { useSyncExternalStore } from "react";

type RedeemedReward = { rewardId: string; redeemedAt: number };

export type LoyaltyState = {
  user: { name: string; onboarded: boolean };
  scans: Record<string, number>; // restaurantId -> stamp count
  redeemed: Record<string, RedeemedReward[]>; // restaurantId -> redeemed rewards
  visitedAt: Record<string, number>; // restaurantId -> last visit
};

const STORAGE_KEY = "stamp.loyalty.v1";

const defaultState: LoyaltyState = {
  user: { name: "", onboarded: false },
  scans: {},
  redeemed: {},
  visitedAt: {},
};

let state: LoyaltyState = load();
const listeners = new Set<() => void>();

function load(): LoyaltyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function setState(updater: (s: LoyaltyState) => LoyaltyState) {
  state = updater(state);
  save();
  listeners.forEach((l) => l());
}

export const loyaltyStore = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  completeOnboarding: (name: string) =>
    setState((s) => ({ ...s, user: { name: name || "Guest", onboarded: true } })),
  reset: () => setState(() => defaultState),
  addScan: (restaurantId: string) =>
    setState((s) => ({
      ...s,
      scans: { ...s.scans, [restaurantId]: (s.scans[restaurantId] || 0) + 1 },
      visitedAt: { ...s.visitedAt, [restaurantId]: Date.now() },
    })),
  redeem: (restaurantId: string, rewardId: string, stampsRequired: number) =>
    setState((s) => {
      const current = s.scans[restaurantId] || 0;
      if (current < stampsRequired) return s;
      const list = s.redeemed[restaurantId] || [];
      return {
        ...s,
        scans: { ...s.scans, [restaurantId]: current - stampsRequired },
        redeemed: {
          ...s.redeemed,
          [restaurantId]: [...list, { rewardId, redeemedAt: Date.now() }],
        },
      };
    }),
};

export function useLoyalty(): LoyaltyState {
  return useSyncExternalStore(loyaltyStore.subscribe, loyaltyStore.getState, loyaltyStore.getState);
}
