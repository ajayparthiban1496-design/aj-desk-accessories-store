export type CategorySlug = "stands" | "mats" | "lighting" | "organisation" | "audio";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
}

export interface Variant {
  id: string;
  name: string;
  /** Hex swatch for the finish selector */
  swatch: string;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: CategorySlug;
  /** Price in paise (₹1 = 100) to avoid float maths */
  price: number;
  compareAtPrice: number | null;
  images: string[];
  variants: Variant[];
  features: string[];
  specs: Record<string, string>;
  rating: number;
  reviewCount: number;
  badge: "Bestseller" | "New" | "Limited" | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  createdAt: string;
}

export type Role = "customer" | "admin";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

export interface ProductFilters {
  category?: CategorySlug;
  search?: string;
  sort?: SortKey;
  maxPrice?: number;
  inStockOnly?: boolean;
}
