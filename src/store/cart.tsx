import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/types";

interface CartContextValue {
  items: CartItem[];
  count: number;
  isOpen: boolean;
  open(): void;
  close(): void;
  add(item: CartItem): void;
  setQuantity(productId: string, variantId: string, quantity: number): void;
  remove(productId: string, variantId: string): void;
  clear(): void;
}

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "aj-cart";
export const MAX_QTY = 10;

const same = (a: CartItem, p: string, v: string) => a.productId === p && a.variantId === v;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[];
    } catch {
      return [];
    }
  });
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((i) => same(i, item.productId, item.variantId));
      if (found) return prev.map((i) => (i === found ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + item.quantity) } : i));
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => !same(i, productId, variantId))
        : prev.map((i) => (same(i, productId, variantId) ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i)),
    );
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQuantity,
      remove: (p, v) => setQuantity(p, v, 0),
      clear: () => setItems([]),
    }),
    [items, isOpen, add, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
