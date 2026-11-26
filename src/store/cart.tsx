import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HttpTypes } from "@medusajs/types";
import { toast } from "sonner";
import type { CartLine, CartTotals } from "@/types";
import { sdk, friendlyError } from "@/lib/medusa/sdk";
import { getRegion, getProductsByIds } from "@/lib/medusa/catalog";
import { toCartLines, toTotals } from "@/lib/medusa/mappers";
import { useBackendOnline } from "@/lib/medusa/status";
import { track } from "@/lib/analytics";

/**
 * The bag is a Medusa cart. Only its id is kept in the browser; items,
 * prices, promotions, shipping, GST and totals always come from Medusa.
 */
const CART_ID_KEY = "aj_cart_id";
export const MAX_QTY = 10;
export const CART_FIELDS = "*items,*promotions,*shipping_methods,+completed_at,+email";

const readCartId = () => localStorage.getItem(CART_ID_KEY);
const writeCartId = (id: string | null) => (id ? localStorage.setItem(CART_ID_KEY, id) : localStorage.removeItem(CART_ID_KEY));

async function fetchCart(): Promise<HttpTypes.StoreCart | null> {
  const id = readCartId();
  if (!id) return null;
  try {
    const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS });
    // A completed cart has become an order; start a fresh bag next time.
    if (cart.completed_at) {
      writeCartId(null);
      return null;
    }
    return cart;
  } catch (e) {
    if ((e as { status?: number }).status === 404) {
      writeCartId(null);
      return null;
    }
    throw e;
  }
}

interface CartContextValue {
  cart: HttpTypes.StoreCart | null;
  lines: CartLine[];
  totals: CartTotals;
  promoCodes: string[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  isUpdating: boolean;
  canOrder: boolean;
  isOpen: boolean;
  open(): void;
  close(): void;
  refetch(): void;
  add(variantId: string, quantity: number, productSlug?: string): Promise<void>;
  setQuantity(lineId: string, quantity: number): void;
  remove(lineId: string): void;
  applyPromo(code: string): Promise<boolean>;
  removePromo(code: string): void;
  /** Forget the cart (after it was turned into an order). */
  reset(): void;
}

const CartContext = createContext<CartContextValue | null>(null);
const EMPTY_TOTALS: CartTotals = { itemTotal: 0, discountTotal: 0, shippingTotal: 0, taxTotal: 0, total: 0 };

export function CartProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const online = useBackendOnline();
  const [isOpen, setOpen] = useState(false);

  const cartQuery = useQuery({ queryKey: ["cart"], queryFn: fetchCart, enabled: online, staleTime: 0 });
  const cart = cartQuery.data ?? null;

  const productIds = [...new Set((cart?.items ?? []).map((i) => i.product_id).filter((id): id is string => Boolean(id)))].sort();
  const productsQuery = useQuery({
    queryKey: ["cart-products", productIds],
    queryFn: () => getProductsByIds(productIds),
    enabled: productIds.length > 0,
  });

  const setCart = useCallback((next: HttpTypes.StoreCart | null) => qc.setQueryData(["cart"], next), [qc]);

  const ensureCart = useCallback(async () => {
    const existing = qc.getQueryData<HttpTypes.StoreCart | null>(["cart"]) ?? (await fetchCart());
    if (existing) return existing;
    const region = await getRegion();
    const { cart: created } = await sdk.store.cart.create({ region_id: region.id }, { fields: CART_FIELDS });
    writeCartId(created.id);
    return created;
  }, [qc]);

  const onError = (e: unknown) => {
    toast.error(friendlyError(e));
    void qc.invalidateQueries({ queryKey: ["cart"] });
  };

  const addMutation = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number; productSlug?: string }) => {
      const current = await ensureCart();
      try {
        return (await sdk.store.cart.createLineItem(current.id, { variant_id: variantId, quantity }, { fields: CART_FIELDS })).cart;
      } catch (e) {
        // A cart from a deleted/changed region can't take items: start a new one once.
        if ((e as { status?: number }).status === 404) {
          writeCartId(null);
          setCart(null);
          const fresh = await ensureCart();
          return (await sdk.store.cart.createLineItem(fresh.id, { variant_id: variantId, quantity }, { fields: CART_FIELDS })).cart;
        }
        throw e;
      }
    },
    onSuccess: (next, vars) => {
      setCart(next);
      setOpen(true);
      track("Add to cart", { product: vars.productSlug ?? vars.variantId });
    },
    onError,
  });

  const quantityMutation = useMutation({
    mutationFn: async ({ lineId, quantity }: { lineId: string; quantity: number }) => {
      const id = readCartId();
      if (!id) return null;
      if (quantity <= 0) {
        const { parent } = await sdk.store.cart.deleteLineItem(id, lineId, { fields: CART_FIELDS });
        return parent ?? null;
      }
      return (await sdk.store.cart.updateLineItem(id, lineId, { quantity }, { fields: CART_FIELDS })).cart;
    },
    // Optimistic quantity so the stepper feels instant; Medusa's response replaces it.
    onMutate: ({ lineId, quantity }) => {
      const prev = qc.getQueryData<HttpTypes.StoreCart | null>(["cart"]);
      if (prev) {
        setCart({
          ...prev,
          items: (prev.items ?? []).flatMap((i) => (i.id !== lineId ? [i] : quantity <= 0 ? [] : [{ ...i, quantity }])),
        });
      }
      return { prev };
    },
    onSuccess: (next) => next && setCart(next),
    onError: (e, _v, ctx) => {
      if (ctx?.prev !== undefined) setCart(ctx.prev);
      onError(e);
    },
  });

  const promoMutation = useMutation({
    mutationFn: async ({ code, action }: { code: string; action: "add" | "remove" }) => {
      const current = await ensureCart();
      const body = { promo_codes: [code] };
      const res = action === "add"
        ? await sdk.store.cart.addPromotions(current.id, body, { fields: CART_FIELDS })
        : await sdk.store.cart.removePromotions(current.id, body, { fields: CART_FIELDS });
      return res.cart;
    },
    onSuccess: (next) => setCart(next),
  });

  const lines = useMemo(() => (cart ? toCartLines(cart, productsQuery.data ?? []) : []), [cart, productsQuery.data]);
  const promoCodes = (cart?.promotions ?? []).map((p) => p.code).filter((c): c is string => Boolean(c));

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      lines,
      totals: cart ? toTotals(cart) : EMPTY_TOTALS,
      promoCodes,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      isLoading: online && (cartQuery.isLoading || (productIds.length > 0 && productsQuery.isLoading)),
      isError: cartQuery.isError,
      isUpdating: addMutation.isPending || quantityMutation.isPending || promoMutation.isPending,
      canOrder: online,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      refetch: () => void cartQuery.refetch(),
      async add(variantId, quantity, productSlug) {
        if (!online) {
          toast.error("Ordering is paused while we reconnect to the shop. Please try again shortly.");
          return;
        }
        await addMutation.mutateAsync({ variantId, quantity, productSlug }).catch(() => undefined);
      },
      setQuantity: (lineId, quantity) => quantityMutation.mutate({ lineId, quantity: Math.min(MAX_QTY, quantity) }),
      remove: (lineId) => quantityMutation.mutate({ lineId, quantity: 0 }),
      async applyPromo(code) {
        const before = (qc.getQueryData<HttpTypes.StoreCart | null>(["cart"])?.promotions ?? []).length;
        try {
          const next = await promoMutation.mutateAsync({ code: code.trim().toUpperCase(), action: "add" });
          const applied = (next.promotions ?? []).length > before;
          if (!applied) toast.error("That code isn't valid for this bag.");
          return applied;
        } catch (e) {
          toast.error(friendlyError(e, "That code isn't valid for this bag."));
          return false;
        }
      },
      removePromo: (code) => promoMutation.mutate({ code, action: "remove" }, { onError }),
      reset: () => {
        writeCartId(null);
        setCart(null);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, lines, promoCodes.join(), online, cartQuery.isLoading, cartQuery.isError, productsQuery.isLoading, addMutation.isPending, quantityMutation.isPending, promoMutation.isPending, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
