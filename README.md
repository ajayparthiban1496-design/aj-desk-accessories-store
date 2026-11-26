# Aj Desk — Premium Desk Accessories Store

Laptop stands, desk mats, lighting and organisers for Indian desks.

- **Storefront:** React 19 + Vite + TypeScript + Tailwind v4 (repo root)
- **Commerce engine:** Medusa 2.23 with Medusa Admin (`backend/apps/backend`)
- **Hosting:** one Vercel project (storefront + Medusa container, Singapore), Neon Postgres

Live: https://aj-desk-accessories-store.vercel.app · Admin: `/app`

**Start here:** [docs/HANDOVER.md](docs/HANDOVER.md) has the architecture, go-live steps and day-to-day Admin guide.

## Run locally

```powershell
npm install
cd backend; npm install; cd ..
npx vercel env pull backend/apps/backend/.env --environment development
npm --prefix backend/apps/backend run dev
npm run dev
```

Storefront on http://localhost:5173, Medusa on http://localhost:9000 (Admin at `/app`). Copy the CORS lines from `backend/apps/backend/.env.template` into that `.env`, and put `VITE_MEDUSA_BACKEND_URL` and `VITE_MEDUSA_PUBLISHABLE_KEY` in `.env.development.local` (see `.env.example`). Without a publishable key the storefront shows its bundled catalogue with ordering paused.

## Useful commands

| Where | Command | Does |
| --- | --- | --- |
| root | `npm run build` | Type-check and build the storefront |
| root | `npm run catalog:export` | Export `src/data/products.ts` for the Medusa seed and rebuild `public/sitemap.xml` |
| backend/apps/backend | `npx medusa db:migrate` | Run migrations (and, on an empty database, set up the whole store) |
| backend/apps/backend | `npm run seed` | Re-runnable store setup: only adds what is missing |
| backend/apps/backend | `npx medusa exec ./src/scripts/publishable-key.ts` | Print the storefront's publishable key |
| backend/apps/backend | `npx medusa user -e <email> -p <password>` | Create an Admin user |
| backend/apps/backend | `npm run lint` | Medusa lint rules |
| root | `npx vercel deploy --prod` | Deploy both services |

## Design

"Warm workshop minimalism": paper-toned neutrals, espresso ink and a walnut/brass accent, set in *Fraunces* and *Manrope*, with light and dark themes. Tokens are in `src/index.css`.

## Keyboard & accessibility

Arrow keys scroll the page and drive the custom widgets (category chips, product gallery, home category row, accordions, tabs). The site has skip links, visible focus rings and labelled form errors, and respects reduced motion.
