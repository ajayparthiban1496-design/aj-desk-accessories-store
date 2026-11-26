# Aj Desk — Medusa Integration: Audit & Plan (Phase 1)

> **Superseded:** the open decisions in §6 were settled by following the 6yards setup (one Vercel project, Medusa container, Neon, pay on delivery, Vite kept). See [HANDOVER.md](./HANDOVER.md) for what was built. This file is kept for reference.

Status: **plan (historical)** · Medusa version targeted: **2.23.0** (npm `@medusajs/medusa`, checked 2026-11-26) · JS SDK `@medusajs/js-sdk@2.23.0`

---

## 1. Project inputs (as resolved)

| Input | Value | Source |
|---|---|---|
| PROJECT_NAME | Aj Desk Accessories Store | repo |
| FRONTEND_FRAMEWORK | **Vite + React 19 SPA** (React Router 7) | repo |
| UI_LIBRARY | Tailwind v4 + hand-built shadcn-style primitives (Radix) | repo |
| PACKAGE_MANAGER | npm | repo |
| REPO_LAYOUT | single repo; storefront at root → add `backend/` beside it (assumption, §5) | assumption |
| FRONTEND_HOST | Vercel (live: aj-desk-accessories-store.vercel.app) | deployed |
| BACKEND_HOST | Railway (server + worker + Postgres + Redis) | assumption |
| DATABASE | Postgres (managed in prod; local for dev) | required |
| REDIS | Railway Redis or Upstash in prod; none in local dev | assumption |
| CURRENCY / REGIONS | INR / India | existing design |
| TAX | GST, **prices tax-inclusive** (storefront already says "Inclusive of all taxes") | existing copy |
| PAYMENT_GATEWAY | **open — see §6** | — |
| SHIPPING | flat ₹149, free over ₹1,999 (manual fulfillment provider) | existing policy |
| CUSTOMER_ACCOUNTS | guest + login | existing pages |
| EMAIL_PROVIDER | Resend (custom notification provider per official guide) | existing README |
| FILE_STORAGE | S3-compatible in prod (Cloudflare R2 / AWS S3); local in dev | assumption |
| PRODUCT_SOURCE | migrate the 13 existing catalogue products via seed script | repo |

---

## 2. Storefront audit — everything that touches commerce data

### Where mock / local data lives
| File | What it holds | Fate |
|---|---|---|
| `src/data/products.ts` | 13 products, variants (finish swatches + stock), 5 categories, 51 reviews, image ID map | becomes **seed input** for Medusa; removed from runtime |
| `src/data/content.ts` | testimonials, press, FAQs, USPs | **stays** (marketing copy, not commerce) |
| `src/lib/api/local.ts` | demo backend on localStorage (products, orders, reviews, wishlist, newsletter, contact) | **removed** |
| `src/lib/api/supabase.ts` + `supabase/` | Supabase backend (schema, RLS, Stripe edge functions) | **superseded** by Medusa — see §6 Q4 |
| `src/lib/utils.ts` → `shippingFor`, `FREE_SHIPPING_THRESHOLD`, `FLAT_SHIPPING` | **client-side money maths** | **removed**; totals come from Medusa. Threshold kept only as display copy for the free-shipping meter, which will read the threshold from the shipping option's rules |

### Data-access layer (single seam — good news)
All UI reads go through `src/lib/api/types.ts` (`Api` interface) and `src/lib/queries.ts` (TanStack Query hooks). Pages never call a backend directly, so swapping in Medusa is mostly a new `Api` implementation plus mappers.

### State management
- Server data: TanStack Query.
- Cart: `src/store/cart.tsx` React context holding `{productId, variantId, quantity}[]` in localStorage; `useCartDetails.ts` joins with products and **computes subtotal/shipping on the client** → must change to a Medusa cart (id in storage, totals from server).
- Auth: `src/auth/AuthProvider.tsx` (Supabase or demo localStorage).

### Pages & components inventory
| Page / component | Uses | Medusa source after migration |
|---|---|---|
| `Home.tsx` | `useProducts({sort})`, `categories` | `store.product.list` (+ categories from `store.category.list`) |
| `Shop.tsx` | `useProducts(filters)` category/search/price/stock/sort | `store.product.list` with `category_id`, `q`, `limit/offset`, `order`; price filter via calculated price |
| `Product.tsx` | `useProduct(slug)`, `useReviews`, wishlist, variant (finish) picker, stock | `store.product.retrieve` by `handle`, `*variants.calculated_price`, `inventory_quantity`; reviews via custom module |
| `ProductCard.tsx` | quick-add first in-stock variant, wishlist heart, swatches | same mapped `Product` shape |
| `Header.tsx` | `categories` for mobile menu, cart count | categories from Medusa; count from Medusa cart |
| `CartDrawer.tsx`, `Cart.tsx`, `CartLine.tsx` | cart lines, qty stepper, free-shipping meter, totals | Medusa cart: `createLineItem/updateLineItem/deleteLineItem`, server totals |
| `Checkout.tsx` | address form (Zod, Indian states, PIN), place order | `cart.update` (email/addresses) → `fulfillment.listCartOptions` → `addShippingMethod` → `payment.initiatePaymentSession` → gateway → `cart.complete` |
| `OrderSuccess.tsx` | order by id (+ guest token) | `store.order.retrieve` |
| `Account.tsx` | orders, wishlist, password | `store.customer`, `store.order.list`; wishlist custom |
| `auth/*` pages | sign in/up, magic link, Google, reset | `sdk.auth.login/register("customer","emailpass")`, reset-password flow; Google via Medusa Google auth provider (optional) |
| `Admin.tsx` | demo product/order admin | **removed** — Medusa Admin (`/app`) replaces it |
| `Newsletter.tsx`, `Contact.tsx` | subscribe, contact form | custom Medusa store routes (Zod-validated, rate-limited) or keep elsewhere — §6 Q4 |

### Product shape mapping (mapper target = existing `Product` type in `src/types.ts`)
| UI field | Medusa field |
|---|---|
| `id`, `slug` | `product.id`, `product.handle` |
| `name`, `tagline`, `description` | `title`, `subtitle`, `description` |
| `category` | first `categories[].handle` |
| `price`, `compareAtPrice` | `variants[0].calculated_price.calculated_amount` (tax-inclusive) / `original_amount` when `price_list_type === "sale"` — **unit change:** Medusa v2 stores major units (₹3499), UI currently uses paise → mapper normalises |
| `images` | `images[].url` (thumbnail first) |
| `variants[]` (finish name, swatch hex, stock) | option "Finish" values; swatch hex in `variant.metadata.swatch`; stock from `inventory_quantity` (requested via fields) |
| `features`, `specs` | `product.metadata.features` / `metadata.specs` |
| `rating`, `reviewCount` | reviews module aggregate (or `metadata` until reviews module exists) |
| `badge`, `isFeatured` | product `tags` (`bestseller`, `new`, `limited`) / collection `featured` |

---

## 3. Target architecture

```
Browser ── Vite/React SPA (Vercel) ── @medusajs/js-sdk (publishable key) ──► Medusa server (Railway)
                                                                              ├─ /store/*  Store API
                                                                              ├─ /app      Admin dashboard
                                                                              └─ /hooks/payment/* webhooks
                                                   Medusa worker (Railway) ◄─┘ subscribers, jobs, workflows
                                                   Postgres + Redis (Railway)   Resend · S3/R2 · payment gateway
```
- Browser holds only: backend URL, publishable key, gateway public key, cart id, customer JWT.
- All money (prices, tax, shipping, totals) comes from Medusa; the SPA only formats it.

---

## 4. Phase plan (each phase ends with typecheck + build + commit + status)

1. **Audit & plan** — this document. ✅
2. **Backend foundation** — `create-medusa-app` into `backend/` (no storefront), `medusa-config.ts` (CORS exact origins, worker mode, Redis modules gated on `REDIS_URL`), `.env.template`, admin user via `npx medusa user`, `docs/BACKEND_SETUP.md`.
3. **Store config & seed** — idempotent `src/scripts/seed.ts`: INR store currency, India region, "Aj Desk Web" sales channel + publishable key, Chennai stock location, shipping profile + options (₹149 flat, free ≥ ₹1,999), GST tax region (tax-inclusive pricing), 5 categories, 13 products migrated from `src/data/products.ts` with finish options, metadata, inventory.
4. **Storefront data layer** — `src/lib/env.ts` (Zod), `src/lib/medusa/{sdk,regions,products,categories,mappers,format-price}.ts`; new `Api` implementation; remove mock/local/supabase runtime code; loading/empty/error states kept.
5. **Cart** — Medusa cart id in localStorage (per SDK docs), lazy create with `region_id`, add/update/remove, promo codes, stale-cart recovery, server totals in drawer and page.
6. **Checkout & payments** — email → address → shipping options → payment session → gateway widget → `cart.complete` → confirmation; double-submit guard, failure/retry, closed-window path via provider webhook.
7. **Customers & emails** — Medusa auth (emailpass), profile, addresses, order history, password reset; Resend notification provider + `order.placed` / shipment / password-reset subscribers.
8. **Hardening & deploy** — rate limits on custom routes, security headers (`vercel.json`), `X-Robots-Tag: noindex` on backend, Railway server/worker config, `DEPLOYMENT.md`, `RUNBOOK.md`.

**SPA caveat (prompt §8):** cache-tag revalidation (`revalidateTag`), Server Components and `generateMetadata` are Next.js features. In the Vite SPA, catalog freshness comes from TanStack Query (short `staleTime`), SEO stays client-side (already has per-page meta + JSON-LD), and the "revalidate" subscriber becomes unnecessary. If a Next.js migration is chosen (§6 Q1), Phase 4 includes it and §8 is implemented in full.

---

## 5. Assumptions made (change any of these)
1. Backend lives in `backend/` in this repo; storefront stays at the root so the existing Vercel project keeps working.
2. Prices in Medusa are entered **GST-inclusive** in INR; one 18 % GST rate on the India region (desk accessories are mostly HSN 9403/9405/4202 at 18 %; a per-category override can be added).
3. Shipping: manual fulfillment provider with two options — "Standard" ₹149, and "Free shipping" ₹0 with a `item_total ≥ 1999` rule.
4. Dev runs without Redis (Medusa falls back to in-memory modules); prod uses Redis.
5. Medusa Admin replaces the storefront's demo `/admin` page.

---

## 6. Decisions needed before Phase 2
1. **Framework** — keep Vite SPA (fastest, live today) or migrate to Next.js App Router (best SEO, required for full §8)?
2. **Payment gateway** — Razorpay (best for India/UPI; no maintained Medusa v2 provider → custom provider, ~1 extra phase of work) or Stripe (official module, quickest)?
3. **Local Postgres** — none installed. Install PostgreSQL 17 locally (winget), or use a free hosted Postgres (Neon/Supabase/Railway) for development too?
4. **Supabase's remaining role** — move reviews, wishlist, newsletter, contact into Medusa (one backend), or drop Supabase entirely and defer those features?
