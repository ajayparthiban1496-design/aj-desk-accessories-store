# Aj Desk — Handover & Go-Live Guide

The current, authoritative guide. `docs/ARCHITECTURE.md` is the original Phase 1 plan, kept for reference.

## 1. What the project is

| Part | Where | Notes |
| --- | --- | --- |
| Storefront | repo root: `src/`, `public/` | React 19 + Vite + Tailwind single-page app |
| Commerce backend | `backend/apps/backend` | Medusa **2.23.0** (Postgres, optional Redis). Admin at `/app` |
| Deployment | `vercel.json` | One Vercel project, two services: the storefront and the Medusa container. `/store`, `/auth`, `/admin`, `/app`, `/files`, `/health`, `/hooks` go to Medusa; everything else to the storefront |

Shoppers and the shop team only ever see one domain.

### How the storefront talks to Medusa

| File | Job |
| --- | --- |
| `src/lib/env.ts` | Validates the public settings: backend URL (empty = same domain) and publishable key |
| `src/lib/medusa/sdk.ts` | The one `@medusajs/js-sdk` client (publishable key on every call, customer JWT in localStorage) |
| `src/lib/medusa/catalog.ts` | Products, categories, newsletter, contact messages. Falls back to the bundled catalogue if Medusa doesn't answer in 4 s |
| `src/lib/medusa/mappers.ts` | Medusa data → the shapes the existing components use (prices to paise, finish swatches, stock) |
| `src/store/cart.tsx` | The bag **is** a Medusa cart; only its id is kept in the browser. All totals come from Medusa |
| `src/lib/medusa/checkout.ts` | Email + address → delivery option → payment session → complete cart → order |
| `src/auth/AuthProvider.tsx` | Customer sign-up / sign-in / password reset with Medusa's `emailpass` provider |
| `src/store/wishlist.ts` | Wishlist saved on the shopper's device (no account needed) |
| `src/data/products.ts` | The launch catalogue: the seed source and the offline backup. Never used for prices when Medusa is up |

**Backend offline:** browsing continues from the bundled catalogue, a notice explains that ordering is paused, and the bag/checkout are disabled. Nothing can be ordered at a stale price.

### What Medusa holds

| Concept | Where in Medusa |
| --- | --- |
| Products, finishes | Products; each finish is a value of the product's **Finish** option, with its colour in variant metadata `swatch` |
| Prices | INR, **GST-inclusive** (store currency setting). Sale prices: price list **Launch offer** (variant price = "was" price) |
| Stock | Inventory at **Chennai Studio** |
| Categories | Products → Categories (handles `stands`, `mats`, `lighting`, `organisation`, `audio`; image URL in category metadata `image`) |
| Shipping | **Standard Delivery** ₹149, free from ₹1,999 (rule on `item_total`) |
| Tax | India tax region, GST 18 % |
| Payment | Medusa's manual provider = **pay on delivery** (cash/UPI) |
| Newsletter | Customers with metadata `newsletter_opt_in = true` |
| Contact form | Admin → **Messages** (custom page) |
| Product details | Metadata: `features` (list), `specs` (key → value), `badge` (Bestseller/New/Limited), `featured` (true/false) |

## 2. Done already

- Neon Postgres **aj-desk-db** (Singapore) created through Vercel and connected to the project.
- Migrations run and the store seeded: India region, GST, Chennai stock location, shipping, 5 categories, 13 products with stock, Launch offer price list, publishable key **Aj Desk Web Key**.
- Vercel environment variables set: `JWT_SECRET`, `COOKIE_SECRET` (sensitive), `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `STOREFRONT_URL`, `VITE_SITE_URL`, `VITE_MEDUSA_PUBLISHABLE_KEY`, plus Neon's `DATABASE_URL` / `DATABASE_URL_UNPOOLED`.

## 3. Still to do (needs you)

1. **Create your Medusa Admin login** (one time). From `backend/apps/backend`, with the database settings pulled locally:
   ```powershell
   npx medusa user -e you@yourdomain.com -p "a-long-strong-password"
   ```
   Then sign in at `https://aj-desk-accessories-store.vercel.app/app`. Invite teammates from **Admin → Settings → Users** (invites made on the live site, not from your PC, because the live secrets differ).
2. **Redis (recommended):** accept Upstash's terms at
   `https://vercel.com/ajayparthiban1496-4452/~/integrations/accept-terms/upstash?source=cli`, then ask for the Redis database to be added. Without it, Admin logins are lost whenever the container restarts.
3. **Emails:** create a Resend account, verify your domain, and set `RESEND_API_KEY` and `STORE_EMAIL_FROM` in Vercel. Order confirmations and password-reset emails start working immediately (until then they're skipped and logged).
4. **Online payments (Razorpay):** needs your Razorpay account. There is no maintained Medusa v2 Razorpay plugin, so it will be a small custom payment provider.
5. **Content to confirm:** the home page's press names, "12,000+ desks" and testimonials are placeholder marketing copy from the design phase. Replace them with real ones or remove them.

## 4. Day-to-day (Medusa Admin at `/app`)

- **Products:** edit title, description, images, price, stock. New products must be in the **Aj Desk Storefront** sales channel and a category.
- **Finishes:** add a value to the product's Finish option, create the variant, and set its variant metadata `swatch` to a hex colour (e.g. `#6b4429`).
- **Sale prices:** Pricing → Price Lists → Launch offer (or create a new sale list).
- **Stock:** Inventory → Chennai Studio. At 0 the site shows "Sold out" and Medusa refuses to add it to a bag.
- **Orders:** Orders → confirm by phone, mark paid when the money arrives, create fulfillment with tracking.
- **Promotions:** Promotions → create a code; shoppers enter it in the bag or at checkout.
- **Messages:** Messages → reply by email, then **Mark handled**.

Changes show on the website within ~30 seconds (on the next page load).

## 5. How a change goes live

1. Commit and push to GitHub (`ajayparthiban1496-design/aj-desk-accessories-store`).
2. Deploy: `npx vercel deploy --prod` from the repo root (or connect the GitHub repo in Vercel → Settings → Git for automatic deploys).
3. If the database schema changed (new custom module/migration), run from `backend/apps/backend`:
   ```powershell
   npx medusa db:migrate
   ```
   To add catalogue changes from `src/data/products.ts`: `npm run catalog:export` at the root, then `npm run seed` in `backend/apps/backend` (only adds what's missing).

## 6. Local development

```powershell
npm install
cd backend; npm install; cd ..
npx vercel env pull backend/apps/backend/.env --environment development   # then add the CORS lines from .env.template
npm --prefix backend/apps/backend run dev      # Medusa on http://localhost:9000 (admin /app)
npm run dev                                    # storefront on http://localhost:5173
```
The storefront reads `VITE_MEDUSA_BACKEND_URL=http://localhost:9000` and the publishable key from `.env.development.local`.

## 7. Known limits

- **Cold start:** the container sleeps after ~5 idle minutes; the first request then takes ~10–20 s. Later requests are fast.
- **Search** filters the (small) catalogue in the browser; for hundreds of products switch to Medusa's search index (`src/search`) or Meilisearch.
- **Reviews** are not built yet (the old demo reviews were fabricated and removed).
- **SEO:** the storefront is a single-page app; titles, descriptions and JSON-LD are set per page in the browser. A Next.js move would add server rendering.
