import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import type { CategorySlug, SortKey } from "@/types";
import { categories } from "@/data/products";
import { useProducts } from "@/lib/queries";
import { usePageMeta } from "@/lib/seo";
import { ProductGrid } from "@/components/ProductCard";
import { EmptyState, ErrorState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { cn, formatPrice } from "@/lib/utils";
import { arrowKeyHandler, centerInScroller } from "@/lib/useArrowKeys";

const sorts: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];
const priceCaps = [100000, 250000, 500000];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = (params.get("category") as CategorySlug | null) ?? undefined;
  const validCategory = categories.find((c) => c.slug === category);
  const search = params.get("q") ?? undefined;
  const sort = (params.get("sort") as SortKey | null) ?? "featured";
  const maxPrice = params.get("max") ? Number(params.get("max")) : undefined;
  const inStockOnly = params.get("stock") === "1";

  const filters = useMemo(() => ({ category: validCategory?.slug, search, sort, maxPrice, inStockOnly }), [validCategory, search, sort, maxPrice, inStockOnly]);
  const { data, isLoading, isError, refetch } = useProducts(filters);

  // Keep the selected category chip visible in the horizontally scrolling bar on small screens.
  useEffect(() => {
    // Wait a frame so the page's scroll-to-top doesn't cancel the smooth scroll.
    const id = requestAnimationFrame(() =>
      centerInScroller(document.querySelector<HTMLElement>('[role="tablist"][aria-label="Categories"] [aria-selected="true"]')),
    );
    return () => cancelAnimationFrame(id);
  }, [validCategory]);

  usePageMeta({
    title: validCategory ? `${validCategory.name} — Shop` : search ? `Search: ${search}` : "Shop all desk accessories",
    description: validCategory
      ? `${validCategory.description} Premium ${validCategory.name.toLowerCase()} from Aj Desk, with free shipping over ₹1,999.`
      : "Shop premium laptop stands, desk mats, monitor lights, lamps and organisers. Free shipping across India over ₹1,999.",
  });

  const update = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const activeCount = (maxPrice ? 1 : 0) + (inStockOnly ? 1 : 0);

  const filterControls = (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Price</legend>
        <div className="space-y-2">
          {[undefined, ...priceCaps].map((cap) => (
            <label key={cap ?? "any"} className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="radio" name="price" className="size-4 accent-[var(--accent)]" checked={maxPrice === cap} onChange={() => update("max", cap ? String(cap) : undefined)} />
              {cap ? `Under ${formatPrice(cap)}` : "Any price"}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Availability</legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={inStockOnly} onChange={(e) => update("stock", e.target.checked ? "1" : undefined)} />
          In stock only
        </label>
      </fieldset>
    </div>
  );

  return (
    <div className="container-page pt-10 md:pt-14">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">{validCategory?.name ?? "Shop"}</li>
        </ol>
      </nav>
      <header className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl md:text-6xl">{search ? <>Results for “{search}”</> : validCategory?.name ?? "All products"}</h1>
          <p className="mt-3 max-w-xl text-muted">{validCategory?.description ?? "Thoughtfully designed accessories for a desk you'll love sitting at."}</p>
        </div>
        {!isLoading && data && <p className="text-sm text-muted" aria-live="polite">{data.length} product{data.length === 1 ? "" : "s"}</p>}
      </header>

      <div className="sticky top-16 z-30 -mx-5 mt-8 border-y border-border bg-background/90 px-5 py-3 backdrop-blur-lg md:top-[72px] md:mx-0 md:px-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-2 overflow-x-auto scroll-px-2 p-0.5 scrollbar-none" role="tablist" aria-label="Categories" onKeyDown={arrowKeyHandler()}>
            {[{ slug: undefined, name: "All" }, ...categories].map((c) => {
              const active = validCategory?.slug === c.slug;
              return (
                <button
                  key={c.name}
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => update("category", c.slug)}
                  className={cn(
                    "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground/30",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="shrink-0 lg:hidden">
            <SlidersHorizontal /> Filters{activeCount ? ` (${activeCount})` : ""}
          </Button>
          <label htmlFor="sort" className="sr-only">Sort products</label>
          <Select id="sort" value={sort} onChange={(e) => update("sort", e.target.value === "featured" ? undefined : e.target.value)} className="hidden h-9 w-auto rounded-full text-sm sm:block">
            {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </div>

      {(search || activeCount > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {search && <Chip label={`“${search}”`} onClear={() => update("q", undefined)} />}
          {maxPrice && <Chip label={`Under ${formatPrice(maxPrice)}`} onClear={() => update("max", undefined)} />}
          {inStockOnly && <Chip label="In stock" onClear={() => update("stock", undefined)} />}
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">{filterControls}</aside>
        <div>
          {isError ? (
            <ErrorState message="We couldn't load products right now." onRetry={() => refetch()} />
          ) : !isLoading && data?.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="Nothing matches that — yet"
              body="Try a different search or clear your filters to see the whole collection."
              action={<Button onClick={() => setParams({})}>Clear all filters</Button>}
            />
          ) : (
            <div className="[&>div]:lg:grid-cols-3">
              <ProductGrid products={data} loading={isLoading} count={6} />
            </div>
          )}
        </div>
      </div>

      <Sheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filters"
        footer={<Button className="w-full" onClick={() => setFiltersOpen(false)}>Show {data?.length ?? 0} products</Button>}
      >
        <div className="space-y-8 px-6 py-6">
          <div className="sm:hidden">
            <label htmlFor="sort-mobile" className="mb-3 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Sort by</label>
            <Select id="sort-mobile" value={sort} onChange={(e) => update("sort", e.target.value === "featured" ? undefined : e.target.value)}>
              {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          {filterControls}
        </div>
      </Sheet>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear(): void }) {
  return (
    <button onClick={onClear} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-sm text-accent hover:bg-accent-soft/70" aria-label={`Remove filter ${label}`}>
      {label} <X className="size-3.5" />
    </button>
  );
}
