import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCart } from "./cart";
import { shippingFor } from "@/lib/utils";

/** Joins cart items with live product data for display and totals. */
export function useCartDetails() {
  const { items } = useCart();
  const ids = [...new Set(items.map((i) => i.productId))].sort();
  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ["cart-products", ids],
    queryFn: () => api.getProductsByIds(ids),
    enabled: ids.length > 0,
  });
  const lines = items.flatMap((item) => {
    const product = products?.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    return product && variant ? [{ ...item, product, variant, lineTotal: product.price * item.quantity }] : [];
  });
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = shippingFor(subtotal);
  return { lines, subtotal, shipping, total: subtotal + shipping, isLoading: ids.length > 0 && isLoading, isError, refetch };
}
