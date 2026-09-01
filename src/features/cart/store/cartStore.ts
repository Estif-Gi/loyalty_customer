import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartScope } from "../types";

export interface CartState {
  scope: CartScope | null;
  items: CartItem[];
  customerNotes: string;

  syncScope: (scope: CartScope) => void;
  addItem: (scope: CartScope, item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  removeItem: (menuItemId: string) => void;
  setCustomerNotes: (notes: string) => void;
  clearCart: () => void;

  getItemCount: () => number;
  getEstimatedSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      scope: null,
      items: [],
      customerNotes: "",

      syncScope: (newScope: CartScope) => {
        const currentScope = get().scope;
        // If changing restaurant or session, reset cart to prevent cross-contamination
        if (
          !currentScope ||
          currentScope.restaurantId !== newScope.restaurantId ||
          currentScope.orderSessionId !== newScope.orderSessionId
        ) {
          set({
            scope: newScope,
            items: [],
            customerNotes: "",
          });
        }
      },

      addItem: (scope: CartScope, item) => {
        const { syncScope } = get();
        syncScope(scope);

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.menuItemId === item.menuItemId);
          const addQty = Math.max(1, Math.min(50, item.quantity ?? 1));

          if (existingIndex > -1) {
            const updated = [...state.items];
            const currentItem = updated[existingIndex];
            const newQty = Math.min(50, currentItem.quantity + addQty);
            updated[existingIndex] = {
              ...currentItem,
              quantity: newQty,
              notes: item.notes !== undefined ? item.notes : currentItem.notes,
            };
            return { items: updated };
          }

          return {
            items: [
              ...state.items,
              {
                menuItemId: item.menuItemId,
                name: item.name,
                unitPrice: item.unitPrice,
                quantity: addQty,
                notes: item.notes || "",
              },
            ],
          };
        });
      },

      updateQuantity: (menuItemId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.menuItemId !== menuItemId),
            };
          }
          const boundedQty = Math.min(50, quantity);
          return {
            items: state.items.map((i) =>
              i.menuItemId === menuItemId ? { ...i, quantity: boundedQty } : i
            ),
          };
        });
      },

      updateNotes: (menuItemId: string, notes: string) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, notes } : i
          ),
        }));
      },

      removeItem: (menuItemId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        }));
      },

      setCustomerNotes: (notes: string) => {
        set({ customerNotes: notes });
      },

      clearCart: () => {
        set({ items: [], customerNotes: "" });
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getEstimatedSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },
    }),
    {
      name: "loyalty-cart-storage",
      partialize: (state) => ({
        scope: state.scope,
        items: state.items,
        customerNotes: state.customerNotes,
      }),
    }
  )
);
