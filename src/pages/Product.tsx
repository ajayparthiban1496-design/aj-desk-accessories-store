import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Heart, PackageSearch, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { useProduct, useProducts, useReviews, useWishlist, qk } from "@/lib/queries";
import { usePageMeta } from "@/lib/seo";
import { useCart } from "@/store/cart";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { reviewSchema, type ReviewInput } from "@/lib/schemas";
import { categories } from "@/data/products";
import { ProductImage } from "@/components/ProductImage";
import { ProductGrid } from "@/components/ProductCard";
import { QuantityStepper } from "@/components/CartLine";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Badge, EmptyState, ErrorState, Price, Rating, Skeleton } from "@/components/ui/misc";
import { cn, formatDate, formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { arrowKeyHandler } from "@/lib/useArrowKeys";
import type { Product } from "@/types";

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 pt-10 lg:grid-cols-2" aria-busy="true" aria-label="Loading product">
      <Skeleton className="aspect-square rounded-[var(--radius-xl)]" />
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-8 h-24 w-full" />
        <Skeleton className="h-13 w-full rounded-full" />
      </div>
    </div>
  );
}

function JsonLd({ product }: { product: Product }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline,
    image: product.images,
    brand: { "@type": "Brand", name: "Aj Desk" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: product.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function Reviews({ product }: { product: Product }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useReviews(product.id);
  const [writing, setWriting] = useState(false);
  const form = useForm<ReviewInput>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0, title: "", body: "" } });

  const submit = useMutation({
    mutationFn: (input: ReviewInput) => api.addReview(product.id, input, user!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.reviews(product.id) });
      form.reset();
      setWriting(false);
      toast.success("Thanks for your review!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section id="reviews" className="container-page mt-24 scroll-mt-24" aria-labelledby="reviews-title">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="reviews-title" className="text-3xl md:text-4xl">Customer reviews</h2>
          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-6xl leading-none">{product.rating.toFixed(1)}</span>
            <div className="pb-1">
              <Rating value={product.rating} size="md" />
              <p className="mt-1 text-sm text-muted">Based on {product.reviewCount.toLocaleString("en-IN")} reviews</p>
            </div>
          </div>
          {user ? (
            <Button variant="outline" className="mt-8" onClick={() => setWriting((w) => !w)}>{writing ? "Cancel" : "Write a review"}</Button>
          ) : (
            <p className="mt-8 text-sm text-muted">
              <Link to="/login" state={{ from: `/products/${product.slug}` }} className="text-foreground underline underline-offset-4">Sign in</Link> to write a review.
            </p>
          )}
        </div>
        <div className="lg:col-span-8">
          {writing && (
            <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="mb-10 space-y-5 rounded-[var(--radius-lg)] bg-surface p-6" noValidate>
              <Controller
                control={form.control}
                name="rating"
                render={({ field, fieldState }) => (
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">Your rating</legend>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => field.onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={field.value === n} className="p-1">
                          <Star className={cn("size-6 transition-colors", n <= field.value ? "fill-accent text-accent" : "text-foreground/25 hover:text-accent")} />
                        </button>
                      ))}
                    </div>
                    {fieldState.error && <p className="mt-1 text-[13px] text-danger" role="alert">{fieldState.error.message}</p>}
                  </fieldset>
                )}
              />
              <Field label="Title" error={form.formState.errors.title?.message}>
                {(p) => <Input {...p} {...form.register("title")} placeholder="Sum it up in a few words" />}
              </Field>
              <Field label="Review" error={form.formState.errors.body?.message}>
                {(p) => <Textarea {...p} {...form.register("body")} placeholder="How has it changed your desk?" />}
              </Field>
              <Button type="submit" loading={submit.isPending}>Submit review</Button>
            </form>
          )}
          {isLoading ? (
            <div className="space-y-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
          ) : isError ? (
            <ErrorState message="Reviews couldn't load." onRetry={() => refetch()} />
          ) : !data?.length ? (
            <EmptyState icon={<Star />} title="No reviews yet" body="Be the first to share how it works on your desk." />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {data.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex items-center justify-between">
                    <Rating value={r.rating} />
                    <time className="text-xs text-muted" dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
                  </div>
                  <h3 className="mt-3 font-sans text-base font-semibold tracking-normal">{r.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{r.body}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm">
                    {r.author} <span className="flex items-center gap-1 text-xs text-success"><Check className="size-3" /> Verified buyer</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ProductPage() {
  const { slug = "" } = useParams();
  const { data: product, isLoading, isError, refetch } = useProduct(slug);
  const related = useProducts(product ? { category: product.category } : undefined);
  const cart = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const [imageIdx, setImageIdx] = useState(0);
  const [variantId, setVariantId] = useState<string>();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setImageIdx(0);
    setQty(1);
    setVariantId(product?.variants.find((v) => v.stock > 0)?.id ?? product?.variants[0]?.id);
  }, [product]);

  usePageMeta({
    title: product?.name ?? "Product",
    description: product ? `${product.tagline} ${product.description.slice(0, 110)}…` : "Premium desk accessories from Aj Desk.",
    image: product?.images[0],
  });

  if (isLoading) return <ProductSkeleton />;
  if (isError) return <div className="container-page py-20"><ErrorState message="We couldn't load this product." onRetry={() => refetch()} /></div>;
  if (!product)
    return (
      <div className="container-page py-20">
        <EmptyState icon={<PackageSearch />} title="Product not found" body="It may have been retired or the link is wrong." action={<Button asChild><Link to="/shop">Browse all products</Link></Button>} />
      </div>
    );

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const soldOut = !variant || variant.stock <= 0;
  const lowStock = variant && variant.stock > 0 && variant.stock <= 8;
  const saved = wishlist.ids.includes(product.id);
  const category = categories.find((c) => c.slug === product.category);

  const addToCart = () => {
    if (!variant) return;
    cart.add({ productId: product.id, variantId: variant.id, quantity: qty });
    track("Add to cart", { product: product.slug });
  };

  return (
    <>
      <JsonLd product={product} />
      <div className="container-page pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex flex-wrap gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to={`/shop?category=${product.category}`} className="hover:text-foreground">{category?.name}</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">{product.name}</li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse gap-3 md:flex-row">
              <div className="flex gap-3 p-1 md:flex-col" role="tablist" aria-label="Product images" aria-orientation="vertical" onKeyDown={arrowKeyHandler({ vertical: true })}>
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    role="tab"
                    aria-selected={i === imageIdx}
                    tabIndex={i === imageIdx ? 0 : -1}
                    aria-label={`Show image ${i + 1}`}
                    onClick={() => setImageIdx(i)}
                    className={cn("overflow-hidden rounded-[var(--radius-md)] ring-2 ring-offset-2 ring-offset-background transition", i === imageIdx ? "ring-accent" : "ring-transparent opacity-70 hover:opacity-100")}
                  >
                    <ProductImage src={img.replace(/w=\d+/, "w=200")} alt="" className="size-16 md:size-20" />
                  </button>
                ))}
              </div>
              <div className="relative flex-1 overflow-hidden rounded-[var(--radius-xl)]">
                <ProductImage key={imageIdx} src={product.images[imageIdx]} alt={`${product.name} — image ${imageIdx + 1}`} className="aspect-square" sizes="(min-width: 1024px) 55vw, 100vw" fetchPriority="high" />
                {product.badge && <Badge tone="accent" className="absolute left-4 top-4 bg-surface/90">{product.badge}</Badge>}
              </div>
            </div>
          </div>

          {/* Buy box */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">{category?.name}</p>
              <h1 className="mt-3 text-4xl leading-tight md:text-5xl">{product.name}</h1>
              <p className="mt-3 text-lg text-muted">{product.tagline}</p>
              <a href="#reviews" className="mt-4 inline-block"><Rating value={product.rating} count={product.reviewCount} size="md" /></a>
              <div className="mt-5">
                <Price price={product.price} compareAt={product.compareAtPrice} className="text-2xl" />
              </div>
              <p className="mt-1 text-xs text-muted">Inclusive of all taxes · or 3 interest-free payments of {formatPrice(Math.ceil(product.price / 3))}</p>

              <fieldset className="mt-8">
                <legend className="text-sm">
                  Finish: <span className="font-semibold">{variant?.name}</span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      aria-pressed={v.id === variant?.id}
                      aria-label={`${v.name}${v.stock <= 0 ? " (sold out)" : ""}`}
                      className={cn(
                        "flex h-11 items-center gap-2 rounded-full border pl-1.5 pr-4 text-sm transition-colors",
                        v.id === variant?.id ? "border-foreground" : "border-border hover:border-foreground/40",
                        v.stock <= 0 && "opacity-50 line-through",
                      )}
                    >
                      <span className="size-8 rounded-full border border-foreground/10" style={{ background: v.swatch }} aria-hidden />
                      {v.name}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 flex items-center gap-3">
                <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(10, variant?.stock ?? 1))} label={product.name} />
                <Button size="lg" className="h-12 flex-1" disabled={soldOut} onClick={addToCart}>
                  {soldOut ? "Sold out" : `Add to bag · ${formatPrice(product.price * qty)}`}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-12"
                  aria-pressed={saved}
                  aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                  onClick={() => (wishlist.enabled ? wishlist.toggle.mutate(product.id) : navigate("/login", { state: { from: `/products/${product.slug}` } }))}
                >
                  <Heart className={cn(saved && "fill-accent text-accent")} />
                </Button>
              </div>
              <p className={cn("mt-3 flex items-center gap-2 text-sm", lowStock ? "text-warning" : soldOut ? "text-danger" : "text-success")}>
                <span className="size-2 rounded-full bg-current" aria-hidden />
                {soldOut ? "Sold out in this finish" : lowStock ? `Only ${variant.stock} left — order soon` : "In stock, ships within 24 hours"}
              </p>

              <ul className="mt-8 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  [Truck, product.price >= FREE_SHIPPING_THRESHOLD ? "Free shipping" : "Free over ₹1,999"],
                  [RotateCcw, "30-day returns"],
                  [ShieldCheck, product.specs.Warranty ? `${product.specs.Warranty} warranty` : "Warranty"],
                ].map(([Icon, label]) => {
                  const I = Icon as typeof Truck;
                  return (
                    <li key={label as string} className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] bg-surface px-2 py-4">
                      <I className="size-5 text-accent" aria-hidden />
                      {label as string}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8">
                <Accordion
                  defaultOpen="about"
                  items={[
                    {
                      id: "about",
                      title: "About this product",
                      content: (
                        <>
                          <p>{product.description}</p>
                          <ul className="mt-4 space-y-2">
                            {product.features.map((f) => (
                              <li key={f} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden />{f}</li>
                            ))}
                          </ul>
                        </>
                      ),
                    },
                    {
                      id: "specs",
                      title: "Specifications",
                      content: (
                        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                          {Object.entries(product.specs).map(([k, v]) => (
                            <div key={k} className="contents">
                              <dt className="text-foreground">{k}</dt>
                              <dd>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      ),
                    },
                    {
                      id: "shipping",
                      title: "Shipping & returns",
                      content: (
                        <p>
                          Ships within 24 hours from Chennai. Delivered in 2–4 days to metros and 4–7 days elsewhere in India. Free returns within 30 days.{" "}
                          <Link to="/shipping-returns" className="text-foreground underline underline-offset-4">Full policy</Link>
                        </p>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Reviews product={product} />

      {related.data && related.data.filter((p) => p.id !== product.id).length > 0 && (
        <section className="container-page mt-24" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-10 text-3xl md:text-4xl">Pairs well with</h2>
          <ProductGrid products={related.data.filter((p) => p.id !== product.id).slice(0, 4)} />
        </section>
      )}

      {/* Mobile sticky add-to-bag */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-lg md:hidden">
        <Button className="w-full" size="lg" disabled={soldOut} onClick={addToCart}>
          {soldOut ? "Sold out" : <>Add to bag · {formatPrice(product.price * qty)}</>}
        </Button>
      </div>
    </>
  );
}
