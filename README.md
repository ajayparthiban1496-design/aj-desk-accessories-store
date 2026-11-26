# Aj Desk — Premium Desk Accessories Store

A full-stack e-commerce store for laptop stands, desk mats, lighting and organisers.
React + Vite + TypeScript + Tailwind v4 on the front, Supabase (Postgres, Auth, Storage, Edge Functions) + Stripe + Resend on the back.

**Design direction — "warm workshop minimalism":** paper-toned neutrals, espresso ink and a walnut/brass accent, set in *Fraunces* (display serif) and *Manrope* (UI sans). It draws on premium desk brands (Oakywood, Grovemade, Balolo, Ugmonk): natural materials, calm photography, finish swatches, strong trust signals.

---

## Quick start (demo mode — no backend needed)

```powershell
npm install
npm run dev
```

Open http://localhost:5173. With no Supabase env vars set, the app runs in **demo mode**:

- the catalogue comes from `src/data/products.ts`
- accounts, orders, reviews, wishlist and newsletter sign-ups are stored in your browser's localStorage
- checkout creates a sample "paid" order (no payment is taken)
- **sign up with any email starting with `admin@`** to get the admin dashboard at `/admin`

## Go live with Supabase + Stripe

1. **Create a Supabase project** at supabase.com and install the CLI (`npm i -g supabase`).
2. **Link and migrate:**
   ```powershell
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```
3. **Seed the catalogue:** paste `supabase/seed.sql` into the SQL editor (or run `supabase db reset` locally). Regenerate it from `src/data/products.ts` with `npm run seed:sql`, which also rebuilds `public/sitemap.xml` (set `SITE_URL` first).
4. **Frontend env:** copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. **Edge Function secrets** (these never go in the frontend):
   ```powershell
   supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... RESEND_API_KEY=re_... SITE_URL=https://your-site.com STORE_EMAIL_FROM="Aj Desk <orders@yourdomain.com>"
   ```
6. **Deploy the functions:**
   ```powershell
   supabase functions deploy create-checkout
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
7. **Stripe webhook:** in the Stripe dashboard, add an endpoint at `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook` for `checkout.session.completed` and `checkout.session.expired`.
8. **Auth:** in Supabase → Authentication → URL configuration, set the Site URL and add `/account` and `/reset-password` as redirect URLs. Enable Google under Providers if you want OAuth.
9. **Make yourself an admin** after signing up:
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
   ```

## Deploy the frontend

- **Sub-path hosting:** the app can also be served from a sub-path (e.g. GitHub Pages) by building with `BASE_PATH=/repo-name/`.
- **Vercel:** import the repo; the build command is `npm run build` and the output folder is `dist`. `vercel.json` handles SPA rewrites.
- **Netlify:** `netlify.toml` is included.
- Add the `VITE_*` env vars in the host's dashboard, and update `public/robots.txt` and the sitemap with your domain.

## Project structure

```
src/
  App.tsx                 routes (lazy-loaded)
  main.tsx                providers: Query, Router, Auth, Cart, Toaster
  index.css               design tokens (light + dark) and base styles
  types.ts                domain types
  data/                   seed catalogue + marketing content
  lib/
    api/                  Api interface → local (demo) and supabase backends
    queries.ts            TanStack Query hooks
    schemas.ts            Zod schemas (client validation)
    seo.ts                per-page title/description/OG/canonical
    analytics.ts          Plausible hook-in (optional)
    useArrowKeys.ts       arrow-key navigation for tab lists and scrollers
  auth/                   AuthProvider (Supabase or demo) + ProtectedRoute
  store/                  cart context + cart/product join
  components/             ui primitives, layout, ProductCard, etc.
  pages/                  Home, Shop, Product, Cart, Checkout, OrderSuccess,
                          auth/*, Account, Admin, About, Contact, Faq, Legal, NotFound
supabase/
  migrations/             schema, RLS policies, storage bucket, RPCs
  functions/              create-checkout, stripe-webhook (+ Resend email)
  seed.sql                generated catalogue seed
scripts/generate-seed.mjs builds seed.sql + sitemap.xml from src/data
```

## Security notes

- RLS is enabled on every table. Orders can only be created by the `create-checkout` function, which uses the service role and re-reads prices and stock from the database.
- Guests view their confirmation page using a per-order secret token (`get_order_by_token`).
- Users can't promote themselves to admin; a trigger blocks role changes by non-admins.
- Stripe, Resend and service-role keys live only in Edge Function secrets.

## Accessibility & keyboard

Semantic landmarks, a skip link, visible focus rings, labelled inputs with linked error messages, and `prefers-reduced-motion` support. Arrow keys scroll the page as normal, and they also work in the custom widgets:

- **Shop category chips:** ←/→ to switch category, Home/End to jump to the ends
- **Product gallery:** ←/→/↑/↓ to change image
- **Home category row:** focus it with Tab, then use ←/→ to scroll on small screens
- **Accordions and the account/admin tabs:** ↑/↓ and ←/→ (Radix built-ins)

## Suggested next features

- Product image upload in the admin (to the `product-images` bucket) and variant/stock editing
- Discount codes and bundles ("Build your setup" with an automatic bundle price)
- Razorpay as an alternative gateway for UPI-first checkout, plus Cash on Delivery
- Shipment tracking integration (Shiprocket / Delhivery) and order-status emails
- A Journal/blog with setup tours for SEO
- Back-in-stock alerts and abandoned-cart emails
