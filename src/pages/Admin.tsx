import { useState } from "react";
import { Link } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IndianRupee, Package, Pencil, Plus, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { usePageMeta } from "@/lib/seo";
import { productSchema, type ProductInput } from "@/lib/schemas";
import { categories } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { ProductImage } from "@/components/ProductImage";
import { formatDate, formatPrice } from "@/lib/utils";
import { statusTone } from "./Account";
import type { OrderStatus, Product } from "@/types";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <Icon className="size-5 text-accent" aria-hidden />
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function ProductEditor({ product, onClose }: { product: Product | null; onClose(): void }) {
  const qc = useQueryClient();
  const isNew = !product;
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    values: product
      ? {
          name: product.name, slug: product.slug, tagline: product.tagline, description: product.description, category: product.category,
          priceRupees: product.price / 100, compareAtRupees: product.compareAtPrice ? product.compareAtPrice / 100 : undefined,
          image: product.images[0], isFeatured: product.isFeatured, isActive: product.isActive,
        }
      : { name: "", slug: "", tagline: "", description: "", category: "stands", priceRupees: 0, image: "", isFeatured: false, isActive: true },
  });
  const { register, handleSubmit, formState: { errors } } = form;

  const save = useMutation({
    mutationFn: (v: ProductInput) => {
      const base: Product = product ?? {
        id: `new-${crypto.randomUUID()}`, images: [], variants: [{ id: `v-${crypto.randomUUID()}`, name: "Standard", swatch: "#1f1f1f", stock: 20 }],
        features: [], specs: {}, rating: 0, reviewCount: 0, badge: "New", createdAt: new Date().toISOString(),
      } as unknown as Product;
      return api.saveProduct({
        ...base,
        name: v.name, slug: v.slug, tagline: v.tagline, description: v.description, category: v.category,
        price: v.priceRupees * 100, compareAtPrice: v.compareAtRupees ? v.compareAtRupees * 100 : null,
        images: [v.image, ...base.images.filter((i) => i !== v.image)], isFeatured: v.isFeatured, isActive: v.isActive,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success(isNew ? "Product created" : "Product saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form id="product-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-5 px-6 py-6" noValidate>
      <Field label="Name" error={errors.name?.message}>{(p) => <Input {...p} {...register("name")} />}</Field>
      <Field label="URL slug" error={errors.slug?.message}>{(p) => <Input {...p} {...register("slug")} placeholder="arc-aluminium-laptop-stand" />}</Field>
      <Field label="Tagline" error={errors.tagline?.message}>{(p) => <Input {...p} {...register("tagline")} />}</Field>
      <Field label="Description" error={errors.description?.message}>{(p) => <Textarea {...p} {...register("description")} />}</Field>
      <Field label="Category" error={errors.category?.message}>
        {(p) => <Select {...p} {...register("category")}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</Select>}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (₹)" error={errors.priceRupees?.message}>{(p) => <Input {...p} type="number" inputMode="numeric" {...register("priceRupees", { valueAsNumber: true })} />}</Field>
        <Field label="Compare at (₹)" optional error={errors.compareAtRupees?.message}>
          {(p) => <Input {...p} type="number" inputMode="numeric" {...register("compareAtRupees", { setValueAs: (v: string) => (v === "" ? undefined : Number(v)) })} />}
        </Field>
      </div>
      <Field label="Main image URL" error={errors.image?.message} hint="Upload to the product-images storage bucket and paste the public URL.">
        {(p) => <Input {...p} {...register("image")} />}
      </Field>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--accent)]" {...register("isActive")} /> Visible in store</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--accent)]" {...register("isFeatured")} /> Featured</label>
      </div>
      <Button type="submit" className="w-full" loading={save.isPending}>{isNew ? "Create product" : "Save changes"}</Button>
    </form>
  );
}

export default function Admin() {
  usePageMeta({ title: "Admin dashboard", description: "Manage products and orders.", noindex: true });
  const qc = useQueryClient();
  const orders = useQuery({ queryKey: ["admin", "orders"], queryFn: api.listAllOrders });
  const products = useQuery({ queryKey: ["admin", "products"], queryFn: api.listAllProductsAdmin });
  const [editing, setEditing] = useState<Product | null | "new">(null);

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => api.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revenue = (orders.data ?? []).filter((o) => o.status !== "cancelled" && o.status !== "pending").reduce((s, o) => s + o.total, 0);
  const tabClass = "h-10 rounded-full px-5 text-sm font-medium text-muted hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

  return (
    <div className="container-page pt-10 md:pt-14">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 text-4xl md:text-5xl">Store dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={IndianRupee} label="Revenue (paid)" value={orders.isLoading ? "—" : formatPrice(revenue)} />
        <Stat icon={ShoppingCart} label="Orders" value={orders.isLoading ? "—" : String(orders.data?.length ?? 0)} />
        <Stat icon={Package} label="Active products" value={products.isLoading ? "—" : String(products.data?.filter((p) => p.isActive).length ?? 0)} />
        <Stat icon={Star} label="Avg. rating" value={products.data?.length ? (products.data.reduce((s, p) => s + p.rating, 0) / products.data.length).toFixed(2) : "—"} />
      </div>

      <Tabs.Root defaultValue="orders" className="mt-10">
        <Tabs.List className="flex gap-1 border-b border-border pb-4" aria-label="Admin sections">
          <Tabs.Trigger value="orders" className={tabClass}>Orders</Tabs.Trigger>
          <Tabs.Trigger value="products" className={tabClass}>Products</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="orders" className="pt-8">
          {orders.isLoading ? <Skeleton className="h-64" /> : orders.isError ? <ErrorState onRetry={() => orders.refetch()} /> : !orders.data?.length ? (
            <EmptyState icon={<ShoppingCart />} title="No orders yet" body="Orders will appear here as soon as customers check out." />
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
                  <tr><th className="p-4">Order</th><th className="p-4">Date</th><th className="p-4">Customer</th><th className="p-4">Items</th><th className="p-4">Total</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {orders.data.map((o) => (
                    <tr key={o.id}>
                      <td className="p-4 font-semibold"><Link to={`/order/${o.id}`} className="hover:text-accent">#{o.orderNumber}</Link></td>
                      <td className="p-4 text-muted">{formatDate(o.createdAt)}</td>
                      <td className="p-4">{o.shippingAddress.fullName}<br /><span className="text-xs text-muted">{o.email}</span></td>
                      <td className="p-4">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                      <td className="p-4">{formatPrice(o.total)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge tone={statusTone[o.status]} className="w-20 justify-center">{o.status}</Badge>
                          <label className="sr-only" htmlFor={`st-${o.id}`}>Change status for order {o.orderNumber}</label>
                          <Select id={`st-${o.id}`} value={o.status} onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })} className="h-9 w-32 text-sm">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="products" className="pt-8">
          <div className="mb-6 flex justify-end">
            <Button onClick={() => setEditing("new")}><Plus /> New product</Button>
          </div>
          {products.isLoading ? <Skeleton className="h-64" /> : products.isError ? <ErrorState onRetry={() => products.refetch()} /> : (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
                  <tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Status</th><th className="p-4"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {products.data?.map((p) => {
                    const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                    return (
                      <tr key={p.id}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <ProductImage src={p.images[0]?.replace(/w=\d+/, "w=120")} alt="" className="size-11 rounded-[var(--radius-sm)]" />
                            <span className="font-semibold">{p.name}</span>
                          </div>
                        </td>
                        <td className="p-4 capitalize text-muted">{p.category}</td>
                        <td className="p-4">{formatPrice(p.price)}</td>
                        <td className="p-4"><span className={stock < 15 ? "text-warning" : ""}>{stock}</span></td>
                        <td className="p-4">
                          <div className="flex gap-1.5">
                            <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Live" : "Hidden"}</Badge>
                            {p.isFeatured && <Badge tone="accent">Featured</Badge>}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Pencil /> Edit</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "New product" : "Edit product"}>
        {editing !== null && <ProductEditor product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}
