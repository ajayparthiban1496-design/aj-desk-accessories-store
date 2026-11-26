import type { AppUser, CartItem, Order, OrderStatus, Product, ProductFilters, Review, ShippingAddress } from "@/types";
import type { ContactInput, ReviewInput } from "@/lib/schemas";

export interface CheckoutResult {
  /** Stripe Checkout URL when a payment provider is configured */
  redirectUrl?: string;
  /** Order id for the confirmation page */
  orderId?: string;
}

export interface Api {
  listProducts(filters?: ProductFilters): Promise<Product[]>;
  listAllProductsAdmin(): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  listReviews(productId: string): Promise<Review[]>;
  addReview(productId: string, input: ReviewInput, user: AppUser): Promise<Review>;
  listWishlist(userId: string): Promise<string[]>;
  toggleWishlist(userId: string, productId: string): Promise<boolean>;
  createCheckout(items: CartItem[], address: ShippingAddress, user: AppUser | null): Promise<CheckoutResult>;
  /** `token` lets guests view their own order (returned by checkout). */
  getOrder(id: string, token?: string): Promise<Order | null>;
  listMyOrders(userId: string): Promise<Order[]>;
  listAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
  saveProduct(product: Product): Promise<Product>;
  subscribeNewsletter(email: string): Promise<void>;
  sendContact(input: ContactInput): Promise<void>;
}
