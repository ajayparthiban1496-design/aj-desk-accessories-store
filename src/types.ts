export type CategorySlug = string;

export interface Category {
  id: string;
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
  /** Units available to sell; null when Medusa doesn't track inventory for the variant */
  stock: number | null;
  sku: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: CategorySlug;
  /** Price in paise (₹1 = 100), GST included, as calculated by Medusa */
  price: number;
  compareAtPrice: number | null;
  images: string[];
  variants: Variant[];
  features: string[];
  specs: Record<string, string>;
  badge: "Bestseller" | "New" | "Limited" | null;
  isFeatured: boolean;
  createdAt: string;
}

export const inStock = (v: Variant) => v.stock === null || v.stock > 0;

/** A Medusa cart line joined with the storefront product it belongs to. */
export interface CartLine {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  /** Line total in paise, GST included */
  total: number;
  product: Product | null;
  title: string;
  variantTitle: string;
  thumbnail: string;
}

export interface CartTotals {
  /** All amounts in paise, GST included */
  itemTotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
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

export interface OrderItem {
  id: string;
  name: string;
  variantName: string;
  image: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  items: OrderItem[];
  totals: CartTotals;
  shippingAddress: ShippingAddress;
  createdAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

export interface ProductFilters {
  category?: CategorySlug;
  search?: string;
  sort?: SortKey;
  maxPrice?: number;
  inStockOnly?: boolean;
}
