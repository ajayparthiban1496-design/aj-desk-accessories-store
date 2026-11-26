import type { HttpTypes } from "@medusajs/types";
import type { CartLine, CartTotals, Category, Order, Product, Variant } from "@/types";

/** Medusa stores INR in rupees (major units); the UI works in paise. */
export const toPaise = (amount: number | null | undefined) => Math.round(Number(amount ?? 0) * 100);

const BADGES = new Set(["Bestseller", "New", "Limited"]);
const FALLBACK_SWATCH = "#d6d0c4";

type Meta = Record<string, unknown> | null | undefined;
const metaString = (m: Meta, key: string) => (typeof m?.[key] === "string" ? (m[key] as string) : "");

export function toCategory(c: HttpTypes.StoreProductCategory): Category {
  return {
    id: c.id,
    slug: c.handle,
    name: c.name,
    description: c.description ?? "",
    image: metaString(c.metadata, "image"),
  };
}

export function toProduct(p: HttpTypes.StoreProduct): Product {
  const meta = p.metadata ?? {};
  // Order finishes by the option value rank set in Admin (then by name).
  const optionOrder = [...(p.options?.[0]?.values ?? [])]
    .sort((a, b) => ((a as { rank?: number | null }).rank ?? 0) - ((b as { rank?: number | null }).rank ?? 0))
    .map((v) => v.value);
  const rankOf = (v: HttpTypes.StoreProductVariant) => {
    const value = v.options?.[0]?.value ?? v.title ?? "";
    const i = optionOrder.indexOf(value);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const variants = [...(p.variants ?? [])].sort((a, b) => rankOf(a) - rankOf(b));

  const mappedVariants: Variant[] = variants.map((v) => ({
    id: v.id,
    name: v.options?.[0]?.value ?? v.title ?? "Standard",
    swatch: metaString(v.metadata, "swatch") || FALLBACK_SWATCH,
    stock: v.manage_inventory ? Math.max(0, v.inventory_quantity ?? 0) : null,
    sku: v.sku ?? null,
  }));

  // Headline price: the cheapest variant, GST included (prices are tax-inclusive in INR).
  const priced = variants
    .map((v) => v.calculated_price)
    .filter((cp): cp is NonNullable<typeof cp> => cp?.calculated_amount != null)
    .sort((a, b) => Number(a.calculated_amount) - Number(b.calculated_amount));
  const cheapest = priced[0];
  const price = toPaise(cheapest?.calculated_amount);
  const original = toPaise(cheapest?.original_amount);

  const images = [...(p.images ?? [])]
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((i) => i.url)
    .filter(Boolean);
  if (!images.length && p.thumbnail) images.push(p.thumbnail);

  const badge = metaString(meta, "badge");
  return {
    id: p.id,
    slug: p.handle,
    name: p.title,
    tagline: p.subtitle ?? "",
    description: p.description ?? "",
    category: p.categories?.[0]?.handle ?? "",
    price,
    compareAtPrice: original > price ? original : null,
    images,
    variants: mappedVariants,
    features: Array.isArray(meta.features) ? (meta.features as string[]) : [],
    specs: meta.specs && typeof meta.specs === "object" ? (meta.specs as Record<string, string>) : {},
    badge: BADGES.has(badge) ? (badge as Product["badge"]) : null,
    isFeatured: meta.featured === true,
    createdAt: metaString(meta, "launched_at") || String(p.created_at ?? ""),
  };
}

type TotalsSource = {
  item_total?: number | null;
  discount_total?: number | null;
  shipping_total?: number | null;
  tax_total?: number | null;
  total?: number | null;
};

export function toTotals(t: TotalsSource): CartTotals {
  return {
    itemTotal: toPaise(t.item_total),
    discountTotal: toPaise(t.discount_total),
    shippingTotal: toPaise(t.shipping_total),
    taxTotal: toPaise(t.tax_total),
    total: toPaise(t.total),
  };
}

export function toCartLines(cart: HttpTypes.StoreCart, products: Product[]): CartLine[] {
  return (cart.items ?? [])
    .map((item) => ({
      id: item.id,
      productId: item.product_id ?? "",
      variantId: item.variant_id ?? "",
      quantity: item.quantity,
      total: toPaise(item.total),
      product: products.find((p) => p.id === item.product_id) ?? null,
      title: item.product_title ?? item.title,
      variantTitle: item.variant_title ?? "",
      thumbnail: item.thumbnail ?? "",
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { first_name: parts[0] ?? "", last_name: parts.slice(1).join(" ") };
}

export function toMedusaAddress(a: { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string }) {
  return {
    ...splitName(a.fullName),
    phone: a.phone,
    address_1: a.line1,
    address_2: a.line2 || undefined,
    city: a.city,
    province: a.state,
    postal_code: a.pincode,
    country_code: "in",
  };
}

export function toOrder(o: HttpTypes.StoreOrder): Order {
  const a = o.shipping_address;
  return {
    id: o.id,
    orderNumber: String(o.display_id ?? o.id),
    email: o.email ?? "",
    status: o.status,
    paymentStatus: o.payment_status,
    fulfillmentStatus: o.fulfillment_status,
    createdAt: String(o.created_at),
    totals: toTotals(o),
    items: (o.items ?? []).map((i) => ({
      id: i.id,
      name: i.product_title ?? i.title,
      variantName: i.variant_title ?? "",
      image: i.thumbnail ?? "",
      unitPrice: toPaise(i.unit_price),
      quantity: i.quantity,
      total: toPaise(i.total),
    })),
    shippingAddress: {
      fullName: [a?.first_name, a?.last_name].filter(Boolean).join(" "),
      email: o.email ?? "",
      phone: a?.phone ?? "",
      line1: a?.address_1 ?? "",
      line2: a?.address_2 ?? "",
      city: a?.city ?? "",
      state: a?.province ?? "",
      pincode: a?.postal_code ?? "",
    },
  };
}
