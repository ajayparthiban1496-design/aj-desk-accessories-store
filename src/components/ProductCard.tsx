import { Link } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import type { Product } from "@/types";
import { inStock } from "@/types";
import { ProductImage } from "./ProductImage";
import { Badge, Price, Skeleton } from "./ui/misc";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const saved = wishlist.has(product.slug);
  const firstInStock = product.variants.find(inStock);
  const soldOut = !firstInStock;

  const quickAdd = () => {
    if (!firstInStock) return;
    void cart.add(firstInStock.id, 1, product.slug);
  };

  const toggleSave = () => wishlist.toggle(product.slug);


  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
        <Link to={`/products/${product.slug}`} aria-label={product.name} className="block">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            fetchPriority={priority ? "high" : undefined}
            className="aspect-[4/5] [&_img]:group-hover:scale-[1.04]"
          />
          {product.images[1] && (
            <ProductImage
              src={product.images[1]}
              alt=""
              aria-hidden
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 max-md:hidden"
            />
          )}
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
          {product.badge && <Badge tone={product.badge === "New" ? "dark" : "accent"} className="bg-surface/90 backdrop-blur">{product.badge}</Badge>}
          {soldOut && <Badge tone="neutral">Sold out</Badge>}
        </div>
        <button
          type="button"
          onClick={toggleSave}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-surface/90 backdrop-blur transition-transform hover:scale-110"
        >
          <Heart className={cn("size-4", saved ? "fill-accent text-accent" : "text-foreground")} />
        </button>
        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut || cart.isUpdating}
          className="absolute inset-x-3 bottom-3 flex h-11 translate-y-2 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground opacity-0 shadow-[var(--shadow-lift)] transition-all duration-300 hover:bg-primary/90 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 disabled:bg-muted max-md:hidden"
        >
          <Plus className="size-4" /> {soldOut ? "Sold out" : "Quick add"}
        </button>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-sans text-[15px] font-semibold tracking-normal">
            <Link to={`/products/${product.slug}`} className="transition-colors hover:text-accent">
              {product.name}
            </Link>
          </h3>
        </div>
        <p className="line-clamp-1 text-sm text-muted">{product.tagline}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <Price price={product.price} compareAt={product.compareAtPrice} className="text-[15px]" />
          <div className="flex gap-1" aria-label={`${product.variants.length} finishes`}>
            {product.variants.slice(0, 4).map((v) => (
              <span key={v.id} title={v.name} className="size-3.5 rounded-full border border-foreground/15" style={{ background: v.swatch }} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] rounded-[var(--radius-lg)]" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export function ProductGrid({ products, loading, count = 8 }: { products?: Product[]; loading?: boolean; count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
      {loading
        ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
        : products?.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
    </div>
  );
}
