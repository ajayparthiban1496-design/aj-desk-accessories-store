-- ════════════════════════════════════════════════════════════════════
-- Aj Desk — initial schema
-- Money is stored as integer paise (₹1 = 100) to avoid float rounding.
-- Every table has RLS enabled with explicit policies.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Helpers ─────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── Profiles & roles ────────────────────────────────────────────────
create type public.user_role as enum ('customer', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used inside policies. SECURITY DEFINER avoids recursive RLS on profiles.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Stop users promoting themselves: only admins may change `role`.
create or replace function public.protect_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- ── Catalogue ───────────────────────────────────────────────────────
create table public.categories (
  slug        text primary key check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  description text not null default '',
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create type public.product_badge as enum ('Bestseller', 'New', 'Limited');

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text not null check (char_length(name) between 3 and 100),
  tagline          text not null default '',
  description      text not null default '',
  category_slug    text not null references public.categories(slug) on update cascade,
  price            int  not null check (price > 0),
  compare_at_price int  check (compare_at_price is null or compare_at_price > 0),
  images           text[] not null default '{}',
  features         text[] not null default '{}',
  specs            jsonb  not null default '{}'::jsonb,
  rating           numeric(2,1) not null default 0,
  review_count     int not null default 0,
  badge            public.product_badge,
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index products_category_idx on public.products (category_slug) where is_active;
create index products_featured_idx on public.products (is_featured) where is_active;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null,
  swatch      text not null default '#1f1f1f' check (swatch ~ '^#[0-9a-fA-F]{6}$'),
  stock       int  not null default 0 check (stock >= 0),
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, name)
);
create index product_variants_product_idx on public.product_variants (product_id);
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ── Reviews ─────────────────────────────────────────────────────────
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating      int  not null check (rating between 1 and 5),
  title       text not null check (char_length(title) between 3 and 80),
  body        text not null check (char_length(body) between 10 and 1500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on public.reviews (product_id, created_at desc);
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- Keep products.rating / review_count in sync incrementally, so review
-- counts imported from a previous platform are preserved.
create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.products set
      rating = round(((rating * review_count) + new.rating) / (review_count + 1), 1),
      review_count = review_count + 1
    where id = new.product_id;
  elsif tg_op = 'DELETE' then
    update public.products set
      rating = case when review_count <= 1 then 0 else round(((rating * review_count) - old.rating) / (review_count - 1), 1) end,
      review_count = greatest(0, review_count - 1)
    where id = old.product_id;
  elsif tg_op = 'UPDATE' and new.rating <> old.rating then
    update public.products set
      rating = round(((rating * review_count) - old.rating + new.rating) / greatest(review_count, 1), 1)
    where id = new.product_id;
  end if;
  return null;
end $$;
create trigger reviews_refresh_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- ── Wishlist ────────────────────────────────────────────────────────
create table public.wishlist_items (
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ── Orders ──────────────────────────────────────────────────────────
create type public.order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

create sequence public.order_number_seq start 104210;

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique default ('AJ' || nextval('public.order_number_seq')),
  user_id            uuid references auth.users(id) on delete set null,
  email              text not null,
  status             public.order_status not null default 'pending',
  subtotal           int not null check (subtotal >= 0),
  shipping           int not null check (shipping >= 0),
  total              int not null check (total >= 0),
  shipping_address   jsonb not null,
  stripe_session_id  text unique,
  -- Secret that lets a guest view their own confirmation page.
  access_token       uuid not null default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  variant_id    uuid references public.product_variants(id) on delete set null,
  product_name  text not null,
  variant_name  text not null,
  image         text not null default '',
  unit_price    int  not null check (unit_price >= 0),
  quantity      int  not null check (quantity between 1 and 10),
  created_at    timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

-- Guest order lookup by secret token (bypasses RLS safely).
create or replace function public.get_order_by_token(p_id uuid, p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(o) - 'access_token' - 'stripe_session_id'
         || jsonb_build_object('order_items', coalesce((select jsonb_agg(to_jsonb(i)) from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.id = p_id and o.access_token = p_token;
$$;
grant execute on function public.get_order_by_token(uuid, uuid) to anon, authenticated;

-- Atomic stock decrement, called by the Stripe webhook once payment succeeds.
create or replace function public.decrement_stock(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants v
     set stock = greatest(0, v.stock - oi.quantity)
    from public.order_items oi
   where oi.order_id = p_order_id and oi.variant_id = v.id;
end $$;
revoke execute on function public.decrement_stock(uuid) from public, anon, authenticated;

-- ── Marketing & support ─────────────────────────────────────────────
create table public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at  timestamptz not null default now()
);

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic       text not null,
  message     text not null check (char_length(message) between 10 and 2000),
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.product_variants       enable row level security;
alter table public.reviews                enable row level security;
alter table public.wishlist_items         enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages       enable row level security;

-- Profiles: own row; admins see all.
create policy "profiles: read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin update" on public.profiles for update using (public.is_admin());

-- Catalogue: public read of active items; admin full control.
create policy "categories: public read" on public.categories for select using (true);
create policy "categories: admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "products: public read active" on public.products for select using (is_active or public.is_admin());
create policy "products: admin insert" on public.products for insert with check (public.is_admin());
create policy "products: admin update" on public.products for update using (public.is_admin()) with check (public.is_admin());
create policy "products: admin delete" on public.products for delete using (public.is_admin());

create policy "variants: public read" on public.product_variants for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.is_active or public.is_admin())));
create policy "variants: admin write" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

-- Reviews: public read; signed-in users write their own.
create policy "reviews: public read" on public.reviews for select using (true);
create policy "reviews: insert own" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "reviews: update own" on public.reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reviews: delete own or admin" on public.reviews for delete using (user_id = auth.uid() or public.is_admin());

-- Wishlist: strictly own rows.
create policy "wishlist: own rows" on public.wishlist_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Orders: created ONLY by the create-checkout Edge Function (service role bypasses RLS).
create policy "orders: read own or admin" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "order_items: read own or admin" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- Newsletter & contact: anyone may insert; only admins can read.
create policy "newsletter: anyone subscribes" on public.newsletter_subscribers for insert with check (true);
create policy "newsletter: admin read" on public.newsletter_subscribers for select using (public.is_admin());
create policy "contact: anyone sends" on public.contact_messages for insert with check (true);
create policy "contact: admin read" on public.contact_messages for select using (public.is_admin());
create policy "contact: admin update" on public.contact_messages for update using (public.is_admin());

-- ════════════════════════════════════════════════════════════════════
-- Storage: product images (public read, admin write, images ≤ 5 MB)
-- ════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "product-images: public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product-images: admin insert" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin update" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin delete" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());
