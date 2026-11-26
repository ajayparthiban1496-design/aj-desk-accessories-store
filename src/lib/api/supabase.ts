/**
 * Supabase backend. All access is governed by RLS policies in
 * supabase/migrations; checkout runs in the `create-checkout` Edge Function so
 * prices and Stripe secrets never live in the browser.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Api } from "./types";
import type { Order, OrderStatus, Product, Review, ShippingAddress } from "@/types";
import { applyFilters } from "./filters";
import { appUrl } from "@/lib/utils";

interface VariantRow { id: string; name: string; swatch: string; stock: number; position: number }
interface ProductRow {
  id: string; slug: string; name: string; tagline: string; description: string;
  category_slug: Product["category"]; price: number; compare_at_price: number | null;
  images: string[]; features: string[]; specs: Record<string, string>;
  rating: number; review_count: number; badge: Product["badge"];
  is_featured: boolean; is_active: boolean; created_at: string;
  product_variants: VariantRow[];
}
interface OrderRow {
  id: string; order_number: string; user_id: string | null; email: string; status: OrderStatus;
  subtotal: number; shipping: number; total: number; shipping_address: ShippingAddress; created_at: string;
  order_items: { product_id: string; variant_id: string; product_name: string; variant_name: string; image: string; unit_price: number; quantity: number }[];
}

const PRODUCT_SELECT = "*, product_variants(id,name,swatch,stock,position)";
const ORDER_SELECT = "*, order_items(*)";

function toProduct(r: ProductRow): Product {
  return {
    id: r.id, slug: r.slug, name: r.name, tagline: r.tagline, description: r.description,
    category: r.category_slug, price: r.price, compareAtPrice: r.compare_at_price,
    images: r.images, features: r.features, specs: r.specs, rating: Number(r.rating),
    reviewCount: r.review_count, badge: r.badge, isFeatured: r.is_featured, isActive: r.is_active,
    createdAt: r.created_at,
    variants: [...(r.product_variants ?? [])].sort((a, b) => a.position - b.position).map(({ id, name, swatch, stock }) => ({ id, name, swatch, stock })),
  };
}

function toOrder(r: OrderRow): Order {
  return {
    id: r.id, orderNumber: r.order_number, userId: r.user_id, email: r.email, status: r.status,
    subtotal: r.subtotal, shipping: r.shipping, total: r.total, shippingAddress: r.shipping_address, createdAt: r.created_at,
    items: r.order_items.map((i) => ({
      productId: i.product_id, variantId: i.variant_id, name: i.product_name, variantName: i.variant_name,
      image: i.image, unitPrice: i.unit_price, quantity: i.quantity,
    })),
  };
}

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function createSupabaseApi(sb: SupabaseClient): Api {
  return {
    async listProducts(filters) {
      // Catalogue is small, so we fetch active products once and filter/sort in memory.
      const rows = must(await sb.from("products").select(PRODUCT_SELECT).eq("is_active", true)) as ProductRow[];
      return applyFilters(rows.map(toProduct), filters);
    },
    async listAllProductsAdmin() {
      const rows = must(await sb.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false })) as ProductRow[];
      return rows.map(toProduct);
    },
    async getProduct(slug) {
      const row = must(await sb.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_active", true).maybeSingle()) as ProductRow | null;
      return row ? toProduct(row) : null;
    },
    async getProductsByIds(ids) {
      if (!ids.length) return [];
      const rows = must(await sb.from("products").select(PRODUCT_SELECT).in("id", ids)) as ProductRow[];
      return rows.map(toProduct);
    },
    async listReviews(productId) {
      const rows = must(
        await sb.from("reviews").select("id, product_id, author_name, rating, title, body, created_at").eq("product_id", productId).order("created_at", { ascending: false }),
      ) as { id: string; product_id: string; author_name: string; rating: number; title: string; body: string; created_at: string }[];
      return rows.map<Review>((r) => ({ id: r.id, productId: r.product_id, author: r.author_name, rating: r.rating, title: r.title, body: r.body, createdAt: r.created_at }));
    },
    async addReview(productId, input, user) {
      const r = must(
        await sb.from("reviews").insert({ product_id: productId, user_id: user.id, author_name: user.fullName || "Customer", ...input }).select().single(),
      ) as { id: string; created_at: string };
      return { id: r.id, productId, author: user.fullName, createdAt: r.created_at, ...input };
    },
    async listWishlist(userId) {
      const rows = must(await sb.from("wishlist_items").select("product_id").eq("user_id", userId)) as { product_id: string }[];
      return rows.map((r) => r.product_id);
    },
    async toggleWishlist(userId, productId) {
      const existing = must(await sb.from("wishlist_items").select("product_id").eq("user_id", userId).eq("product_id", productId).maybeSingle());
      if (existing) {
        must(await sb.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", productId));
        return false;
      }
      must(await sb.from("wishlist_items").insert({ user_id: userId, product_id: productId }));
      return true;
    },
    async createCheckout(items, address) {
      const { data, error } = await sb.functions.invoke<{ url?: string; orderId?: string; error?: string }>("create-checkout", {
        body: { items, address, origin: appUrl() },
      });
      if (error || !data || data.error) throw new Error(data?.error ?? "We couldn't start checkout. Please try again.");
      return { redirectUrl: data.url, orderId: data.orderId };
    },
    async getOrder(id, token) {
      if (token) {
        // Guests can't read orders through RLS; this SECURITY DEFINER function checks the secret token.
        const data = must(await sb.rpc("get_order_by_token", { p_id: id, p_token: token })) as OrderRow | null;
        if (data) return toOrder(data);
      }
      const row = must(await sb.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle()) as OrderRow | null;
      return row ? toOrder(row) : null;
    },
    async listMyOrders(userId) {
      const rows = must(await sb.from("orders").select(ORDER_SELECT).eq("user_id", userId).order("created_at", { ascending: false })) as OrderRow[];
      return rows.map(toOrder);
    },
    async listAllOrders() {
      const rows = must(await sb.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(200)) as OrderRow[];
      return rows.map(toOrder);
    },
    async updateOrderStatus(id, status) {
      must(await sb.from("orders").update({ status }).eq("id", id));
    },
    async saveProduct(p) {
      const row = {
        slug: p.slug, name: p.name, tagline: p.tagline, description: p.description, category_slug: p.category,
        price: p.price, compare_at_price: p.compareAtPrice, images: p.images, features: p.features, specs: p.specs,
        badge: p.badge, is_featured: p.isFeatured, is_active: p.isActive,
      };
      const isNew = p.id.startsWith("new-");
      const saved = must(
        isNew
          ? await sb.from("products").insert(row).select(PRODUCT_SELECT).single()
          : await sb.from("products").update(row).eq("id", p.id).select(PRODUCT_SELECT).single(),
      ) as ProductRow;
      if (isNew && p.variants.length) {
        must(await sb.from("product_variants").insert(p.variants.map((v, i) => ({ product_id: saved.id, name: v.name, swatch: v.swatch, stock: v.stock, position: i }))));
      }
      return toProduct(saved);
    },
    async subscribeNewsletter(email) {
      const { error } = await sb.from("newsletter_subscribers").insert({ email: email.toLowerCase() });
      if (error?.code === "23505") throw new Error("You're already on the list — thank you!");
      if (error) throw new Error(error.message);
    },
    async sendContact(input) {
      must(await sb.from("contact_messages").insert(input));
    },
  };
}
