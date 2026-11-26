/**
 * Demo-mode backend: seed data + localStorage. Mirrors the Supabase backend's
 * behaviour (including server-side price calculation) so every flow works
 * offline. Never used when VITE_SUPABASE_* env vars are set.
 */
import type { Api } from "./types";
import type { Order, Product, Review } from "@/types";
import { seedProducts, seedReviews } from "@/data/products";
import { applyFilters } from "./filters";
import { shippingFor, uid } from "@/lib/utils";

const KEY = {
  products: "aj-demo-products",
  reviews: "aj-demo-reviews",
  orders: "aj-demo-orders",
  wishlist: "aj-demo-wishlist",
  newsletter: "aj-demo-newsletter",
  contact: "aj-demo-contact",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
/** Small artificial latency so loading states are visible in demo mode. */
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const products = () => read<Product[]>(KEY.products, seedProducts);
const reviews = () => read<Review[]>(KEY.reviews, seedReviews);
const orders = () => read<Order[]>(KEY.orders, []);

export const localApi: Api = {
  async listProducts(filters) {
    await delay();
    return applyFilters(products(), filters);
  },
  async listAllProductsAdmin() {
    await delay();
    return products();
  },
  async getProduct(slug) {
    await delay();
    return products().find((p) => p.slug === slug && p.isActive) ?? null;
  },
  async getProductsByIds(ids) {
    return products().filter((p) => ids.includes(p.id));
  },
  async listReviews(productId) {
    await delay(150);
    return reviews()
      .filter((r) => r.productId === productId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addReview(productId, input, user) {
    await delay();
    const review: Review = { id: uid("r-"), productId, author: user.fullName || user.email.split("@")[0], createdAt: new Date().toISOString(), ...input };
    write(KEY.reviews, [review, ...reviews()]);
    return review;
  },
  async listWishlist(userId) {
    return read<Record<string, string[]>>(KEY.wishlist, {})[userId] ?? [];
  },
  async toggleWishlist(userId, productId) {
    const all = read<Record<string, string[]>>(KEY.wishlist, {});
    const list = all[userId] ?? [];
    const has = list.includes(productId);
    all[userId] = has ? list.filter((id) => id !== productId) : [...list, productId];
    write(KEY.wishlist, all);
    return !has;
  },
  async createCheckout(items, address, user) {
    await delay(700);
    const catalog = products();
    // Prices are always taken from the catalogue, never from the client cart.
    const lines = items.map((item) => {
      const p = catalog.find((x) => x.id === item.productId);
      const variant = p?.variants.find((v) => v.id === item.variantId);
      if (!p || !variant || !p.isActive) throw new Error("An item in your bag is no longer available.");
      if (variant.stock < item.quantity) throw new Error(`Only ${variant.stock} left of ${p.name} (${variant.name}).`);
      return { productId: p.id, variantId: variant.id, name: p.name, variantName: variant.name, image: p.images[0], unitPrice: p.price, quantity: item.quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const shipping = shippingFor(subtotal);
    const order: Order = {
      id: uid("o-"),
      orderNumber: "AJ" + Math.floor(100000 + Math.random() * 900000),
      userId: user?.id ?? null,
      email: address.email,
      status: "paid",
      items: lines,
      subtotal,
      shipping,
      total: subtotal + shipping,
      shippingAddress: address,
      createdAt: new Date().toISOString(),
    };
    write(KEY.orders, [order, ...orders()]);
    // decrement stock
    write(
      KEY.products,
      catalog.map((p) => ({
        ...p,
        variants: p.variants.map((v) => {
          const line = lines.find((l) => l.variantId === v.id);
          return line ? { ...v, stock: v.stock - line.quantity } : v;
        }),
      })),
    );
    return { orderId: order.id };
  },
  async getOrder(id) {
    await delay();
    return orders().find((o) => o.id === id) ?? null;
  },
  async listMyOrders(userId) {
    await delay();
    return orders().filter((o) => o.userId === userId);
  },
  async listAllOrders() {
    await delay();
    return orders();
  },
  async updateOrderStatus(id, status) {
    await delay(150);
    write(KEY.orders, orders().map((o) => (o.id === id ? { ...o, status } : o)));
  },
  async saveProduct(product) {
    await delay();
    const list = products();
    const exists = list.some((p) => p.id === product.id);
    write(KEY.products, exists ? list.map((p) => (p.id === product.id ? product : p)) : [product, ...list]);
    return product;
  },
  async subscribeNewsletter(email) {
    await delay();
    const list = read<string[]>(KEY.newsletter, []);
    if (list.includes(email.toLowerCase())) throw new Error("You're already on the list — thank you!");
    write(KEY.newsletter, [...list, email.toLowerCase()]);
  },
  async sendContact(input) {
    await delay(500);
    write(KEY.contact, [...read<unknown[]>(KEY.contact, []), { ...input, createdAt: new Date().toISOString() }]);
  },
};
