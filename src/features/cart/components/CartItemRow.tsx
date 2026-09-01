import React, { useState } from "react";
import { Plus, Minus, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCartStore } from "../store/cartStore";
import type { CartItem } from "../types";
import { formatCurrency } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const { updateQuantity, updateNotes, removeItem } = useCartStore();
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState(item.notes || "");

  const handleSaveNote = () => {
    updateNotes(item.menuItemId, noteText);
    setIsNoteDialogOpen(false);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-lg font-bold text-foreground leading-tight truncate">
            {item.name}
          </h4>
          <p className="text-sm font-semibold text-primary mt-0.5">
            {formatCurrency(item.unitPrice * item.quantity)}
          </p>
          {item.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
              Note: {item.notes}
            </p>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-secondary/70 rounded-2xl p-1 border border-border/50">
          <button
            onClick={() => {
              if (item.quantity === 1) {
                removeItem(item.menuItemId);
              } else {
                updateQuantity(item.menuItemId, item.quantity - 1);
              }
            }}
            className="h-8 w-8 rounded-xl bg-card flex items-center justify-center text-foreground hover:bg-card/80 tap-scale"
            aria-label="Decrease quantity"
          >
            {item.quantity === 1 ? (
              <Trash2 className="h-4 w-4 text-destructive" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
          </button>

          <span className="w-6 text-center text-sm font-bold text-foreground">
            {item.quantity}
          </span>

          <button
            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
            disabled={item.quantity >= 50}
            className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 tap-scale disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <button
          onClick={() => {
            setNoteText(item.notes || "");
            setIsNoteDialogOpen(true);
          }}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium tap-scale"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>{item.notes ? "Edit note" : "Add special note"}</span>
        </button>

        <button
          onClick={() => removeItem(item.menuItemId)}
          className="text-xs text-destructive hover:underline font-medium"
        >
          Remove
        </button>
      </div>

      {/* Special instructions dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Item Instructions</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="e.g. No onions, dressing on side..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="rounded-2xl h-12 text-sm"
              maxLength={120}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsNoteDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveNote} className="rounded-xl">
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CartItemRow;
