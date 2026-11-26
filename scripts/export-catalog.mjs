// Exports the storefront's catalogue (src/data/products.ts) for the Medusa
// seed, and rebuilds public/sitemap.xml.
//   npm run catalog:export
// Output: backend/apps/backend/src/data/aj-desk-catalog.json (prices in rupees).
import { createServer } from "vite";
import { mkdirSync, writeFileSync } from "node:fs";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const { seedProducts, categories } = await server.ssrLoadModule("/src/data/products.ts");
await server.close();

const rupees = (paise) => (paise == null ? null : Math.round(paise / 100));
const skuBase = (id) => "AJ-" + id.replace(/^p-/, "").toUpperCase();
const skuPart = (name) => name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

const catalog = {
  categories: categories.map((c, rank) => ({ handle: c.slug, name: c.name, description: c.description, image: c.image, rank })),
  products: seedProducts.map((p) => ({
    storefront_id: p.id,
    handle: p.slug,
    title: p.name,
    subtitle: p.tagline,
    description: p.description,
    category: p.category,
    price: rupees(p.price),
    compare_at_price: rupees(p.compareAtPrice),
    images: p.images,
    features: p.features,
    specs: p.specs,
    badge: p.badge,
    featured: p.isFeatured,
    created_at: p.createdAt,
    variants: p.variants.map((v) => ({
      title: v.name,
      sku: `${skuBase(p.id)}-${skuPart(v.name)}`,
      swatch: v.swatch,
      stock: v.stock,
    })),
  })),
};

const out = "backend/apps/backend/src/data/aj-desk-catalog.json";
mkdirSync("backend/apps/backend/src/data", { recursive: true });
writeFileSync(out, JSON.stringify(catalog, null, 2) + "\n");
console.log(`Wrote ${out} (${catalog.products.length} products, ${catalog.categories.length} categories)`);

// sitemap.xml — set SITE_URL to your production domain before running.
const site = (process.env.SITE_URL ?? "https://aj-desk-accessories-store.vercel.app").replace(/\/$/, "");
const paths = [
  "/", "/shop", "/about", "/contact", "/faq", "/shipping-returns", "/privacy", "/terms",
  ...categories.map((c) => `/shop?category=${c.slug}`),
  ...seedProducts.map((p) => `/products/${p.slug}`),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
  .map((p) => `  <url><loc>${site}${p.replace(/&/g, "&amp;")}</loc></url>`)
  .join("\n")}\n</urlset>\n`;
writeFileSync("public/sitemap.xml", xml);
console.log(`Wrote public/sitemap.xml (${paths.length} URLs)`);
