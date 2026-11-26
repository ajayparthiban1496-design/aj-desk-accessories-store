import { useQuery } from "@tanstack/react-query";
import type { ProductFilters } from "@/types";
import { getProduct, listCategories, listProducts } from "@/lib/medusa/catalog";

export const qk = {
  products: (f?: ProductFilters) => ["products", f ?? {}] as const,
  product: (slug: string) => ["product", slug] as const,
  categories: ["categories"] as const,
  myOrders: (uid: string) => ["orders", "mine", uid] as const,
  order: (id: string) => ["order", id] as const,
};

// Short stale time: price, stock and catalogue edits in Medusa Admin show up on the next visit.
export const useProducts = (f?: ProductFilters) => useQuery({ queryKey: qk.products(f), queryFn: () => listProducts(f), staleTime: 30_000 });
export const useProduct = (slug: string) => useQuery({ queryKey: qk.product(slug), queryFn: () => getProduct(slug), staleTime: 30_000 });
export const useCategories = () => useQuery({ queryKey: qk.categories, queryFn: listCategories, staleTime: 5 * 60_000 });
