"use client";

import * as React from "react";
import { toast } from "sonner";
import type { CartItem, CartState } from "@/lib/cart-types";

const STORAGE_KEY = "shopflow.cart.v1";

type CartContextValue = {
  items: CartItem[];
  couponCode: string | null;
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

function loadInitial(): CartState {
  if (typeof window === "undefined") return { items: [], couponCode: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], couponCode: null };
    const parsed = JSON.parse(raw) as CartState;
    return { items: parsed.items ?? [], couponCode: parsed.couponCode ?? null };
  } catch {
    return { items: [], couponCode: null };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CartState>({ items: [], couponCode: null });
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    setState(loadInitial());
    hydrated.current = true;
  }, []);

  React.useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = React.useCallback<CartContextValue["addItem"]>((item) => {
    setState((prev) => {
      const qty = item.quantity ?? 1;
      const idx = prev.items.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId,
      );
      if (idx >= 0) {
        const next = [...prev.items];
        const newQty = Math.min(next[idx].quantity + qty, item.maxQuantity);
        next[idx] = { ...next[idx], quantity: newQty };
        return { ...prev, items: next };
      }
      return {
        ...prev,
        items: [...prev.items, { ...item, quantity: Math.min(qty, item.maxQuantity) }],
      };
    });
    toast.success("Ajouté au panier", { description: item.name });
  }, []);

  const updateQuantity = React.useCallback<CartContextValue["updateQuantity"]>(
    (productId, variantId, quantity) => {
      setState((prev) => ({
        ...prev,
        items: prev.items
          .map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity: Math.max(0, Math.min(quantity, i.maxQuantity)) }
              : i,
          )
          .filter((i) => i.quantity > 0),
      }));
    },
    [],
  );

  const removeItem = React.useCallback<CartContextValue["removeItem"]>((productId, variantId) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter(
        (i) => !(i.productId === productId && i.variantId === variantId),
      ),
    }));
  }, []);

  const clear = React.useCallback(() => setState({ items: [], couponCode: null }), []);
  const setCoupon = React.useCallback(
    (code: string | null) => setState((prev) => ({ ...prev, couponCode: code })),
    [],
  );

  const count = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        couponCode: state.couponCode,
        count,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clear,
        setCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
