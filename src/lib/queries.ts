import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProductFilters } from "@/types";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "sonner";

export const qk = {
  products: (f?: ProductFilters) => ["products", f ?? {}] as const,
  product: (slug: string) => ["product", slug] as const,
  reviews: (id: string) => ["reviews", id] as const,
  wishlist: (uid: string) => ["wishlist", uid] as const,
  myOrders: (uid: string) => ["orders", "mine", uid] as const,
  order: (id: string) => ["order", id] as const,
};

export const useProducts = (f?: ProductFilters) => useQuery({ queryKey: qk.products(f), queryFn: () => api.listProducts(f) });
export const useProduct = (slug: string) => useQuery({ queryKey: qk.product(slug), queryFn: () => api.getProduct(slug) });
export const useReviews = (productId: string | undefined) =>
  useQuery({ queryKey: qk.reviews(productId ?? ""), queryFn: () => api.listReviews(productId!), enabled: !!productId });

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.wishlist(user?.id ?? "anon"), queryFn: () => api.listWishlist(user!.id), enabled: !!user });
  const toggle = useMutation({
    mutationFn: (productId: string) => api.toggleWishlist(user!.id, productId),
    onSuccess: (added) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(added ? "Saved to your wishlist" : "Removed from wishlist");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return { ids: query.data ?? [], isLoading: query.isLoading, toggle, enabled: !!user };
}
