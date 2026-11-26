import type { Product, ProductFilters } from "@/types";
import { inStock } from "@/types";

/** Search, filter and sort in the browser: the catalogue is small enough to load whole. */
export function applyFilters(list: Product[], f: ProductFilters = {}): Product[] {
  let out = list;
  if (f.category) out = out.filter((p) => p.category === f.category);
  if (f.search) {
    const q = f.search.toLowerCase().trim();
    out = out.filter((p) => [p.name, p.tagline, p.category, ...p.features].join(" ").toLowerCase().includes(q));
  }
  if (f.maxPrice) out = out.filter((p) => p.price <= f.maxPrice!);
  if (f.inStockOnly) out = out.filter((p) => p.variants.some(inStock));
  const sorted = [...out];
  switch (f.sort) {
    case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
    case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
    case "newest": sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    default: sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name));
  }
  return sorted;
}
