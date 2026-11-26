import type { HttpTypes } from "@medusajs/types";
import type { ShippingAddress } from "@/types";
import { sdk } from "./sdk";
import { toMedusaAddress, toPaise } from "./mappers";
import { CART_FIELDS } from "@/store/cart";

/** Medusa's built-in manual provider: the order is placed now and paid on delivery. */
export const PAY_ON_DELIVERY_PROVIDER = "pp_system_default";

export interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  /** Paise, GST included */
  amount: number;
}

/** Delivery options Medusa offers for this cart (prices already apply the free-shipping rule). */
export async function listDeliveryOptions(cartId: string): Promise<DeliveryOption[]> {
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cartId });
  return shipping_options
    .filter((o) => !o.insufficient_inventory)
    .map((o) => ({
      id: o.id,
      name: o.name,
      description: o.type?.description ?? "",
      amount: toPaise(o.calculated_price?.calculated_amount ?? o.amount),
    }))
    .sort((a, b) => a.amount - b.amount);
}

/** Medusa needs a destination country before it can offer delivery options. */
export async function ensureIndianDestination(cart: HttpTypes.StoreCart) {
  if (cart.shipping_address?.country_code) return cart;
  return (await sdk.store.cart.update(cart.id, { shipping_address: { country_code: "in" } }, { fields: CART_FIELDS })).cart;
}

export async function selectDeliveryOption(cartId: string, optionId: string) {
  return (await sdk.store.cart.addShippingMethod(cartId, { option_id: optionId }, { fields: CART_FIELDS })).cart;
}

/**
 * Email + addresses -> delivery method -> payment session -> complete.
 * Returns the created order. Medusa validates stock and recalculates every total.
 */
export async function placeOrder(cartId: string, address: ShippingAddress, deliveryOptionId: string): Promise<HttpTypes.StoreOrder> {
  const medusaAddress = toMedusaAddress(address);
  await sdk.store.cart.update(cartId, {
    email: address.email,
    shipping_address: medusaAddress,
    billing_address: medusaAddress,
  });
  const { cart } = await sdk.store.cart.addShippingMethod(cartId, { option_id: deliveryOptionId }, { fields: "*payment_collection,*payment_collection.payment_sessions" });

  const hasSession = cart.payment_collection?.payment_sessions?.some((s) => s.provider_id === PAY_ON_DELIVERY_PROVIDER);
  if (!hasSession) {
    await sdk.store.payment.initiatePaymentSession(cart, { provider_id: PAY_ON_DELIVERY_PROVIDER });
  }

  const result = await sdk.store.cart.complete(cartId);
  if (result.type === "order") return result.order;
  throw new Error(result.error?.message || "We couldn't place your order. Please check your bag and try again.");
}

export async function getOrder(id: string) {
  const { order } = await sdk.store.order.retrieve(id, { fields: "*items,*shipping_address,+display_id,+payment_status,+fulfillment_status" });
  return order;
}

export async function listMyOrders() {
  const { orders } = await sdk.store.order.list({ limit: 50, order: "-created_at", fields: "*items,*shipping_address,+display_id,+payment_status,+fulfillment_status" });
  return orders;
}
