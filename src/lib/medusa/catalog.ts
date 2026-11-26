import type { HttpTypes } from "@medusajs/types";
import type { Category, Product, ProductFilters } from "@/types";
import { categories as bundledCategories, seedProducts } from "@/data/products";
import { sdk } from "./sdk";
import { toCategory, toProduct } from "./mappers";
import { applyFilters } from "./filters";
import { withFallback } from "./status";

const PRODUCT_FIELDS = [
  "id", "title", "subtitle", "handle", "description", "thumbnail", "metadata", "created_at",
  "*images", "*categories", "*options", "*options.values",
  // "*variants" keeps metadata (finish swatch) and sku alongside the relations below.
  "*variants", "*variants.options", "*variants.calculated_price", "+variants.inventory_quantity",
].join(",");

let regionPromise: Promise<HttpTypes.StoreRegion> | null = null;

/** The India region (INR, GST). Looked up once per page load. */
export function getRegion() {
  regionPromise ??= sdk.store.region.list({ limit: 50 }).then(({ regions }) => {
    const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === "in")) ?? regions[0];
    if (!region) throw new Error("The shop has no region set up yet.");
    return region;
  });
  regionPromise.catch(() => {
    regionPromise = null;
  });
  return regionPromise;
}

async function fetchAllProducts(): Promise<Product[]> {
  const region = await getRegion();
  const { products } = await sdk.store.product.list({
    limit: 200,
    region_id: region.id,
    country_code: "in",
    fields: PRODUCT_FIELDS,
  } as HttpTypes.StoreProductListParams);
  return products.map(toProduct);
}

export const listProducts = (filters?: ProductFilters) =>
  withFallback(
    async () => applyFilters(await fetchAllProducts(), filters),
    () => applyFilters(seedProducts, filters),
  );

export const getProduct = (slug: string) =>
  withFallback(
    async () => {
      const region = await getRegion();
      const { products } = await sdk.store.product.list({
        handle: slug,
        region_id: region.id,
        country_code: "in",
        fields: PRODUCT_FIELDS,
      } as HttpTypes.StoreProductListParams);
      return products[0] ? toProduct(products[0]) : null;
    },
    () => seedProducts.find((p) => p.slug === slug) ?? null,
  );

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const region = await getRegion();
  const { products } = await sdk.store.product.list({
    id: ids,
    limit: ids.length,
    region_id: region.id,
    country_code: "in",
    fields: PRODUCT_FIELDS,
  } as HttpTypes.StoreProductListParams);
  return products.map(toProduct);
}

export const listCategories = (): Promise<Category[]> =>
  withFallback(
    async () => {
      const { product_categories } = await sdk.store.category.list({
        limit: 100,
        fields: "id,name,handle,description,metadata,rank,parent_category_id",
      });
      return product_categories
        .filter((c) => !c.parent_category_id)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map(toCategory);
    },
    () => bundledCategories,
  );

/** Newsletter sign-up, saved as a Medusa customer with newsletter_opt_in metadata. */
export async function subscribeNewsletter(email: string) {
  await sdk.client.fetch("/store/newsletter", { method: "POST", body: { email } });
}

/** Contact-form message, saved in Medusa (Admin -> Messages). */
export async function sendContactMessage(input: { name: string; email: string; topic: string; message: string }) {
  await sdk.client.fetch("/store/contact-messages", { method: "POST", body: input });
}
