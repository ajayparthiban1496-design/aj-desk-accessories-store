import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, LayoutDashboard, LogOut, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { qk, useWishlist } from "@/lib/queries";
import { usePageMeta } from "@/lib/seo";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { formatDate, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export const statusTone: Record<OrderStatus, "warning" | "success" | "accent" | "neutral" | "danger"> = {
  pending: "warning",
  paid: "accent",
  shipped: "neutral",
  delivered: "success",
  cancelled: "danger",
};

function Orders({ userId }: { userId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: qk.myOrders(userId), queryFn: () => api.listMyOrders(userId) });
  if (isLoading) return <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.length)
    return <EmptyState icon={<Package />} title="No orders yet" body="When you place an order, you'll be able to track it here." action={<Button asChild><Link to="/shop">Start shopping</Link></Button>} />;
  return (
    <ul className="space-y-4">
      {data.map((o) => (
        <li key={o.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Order #{o.orderNumber}</p>
              <p className="text-sm text-muted">{formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} items · {formatPrice(o.total)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={statusTone[o.status]}>{o.status}</Badge>
              <Button asChild variant="outline" size="sm"><Link to={`/order/${o.id}`}>Details</Link></Button>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {o.items.slice(0, 5).map((i) => (
              <ProductImage key={i.variantId} src={i.image.replace(/w=\d+/, "w=200")} alt={i.name} className="size-14 rounded-[var(--radius-sm)]" />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Wishlist() {
  const { ids, isLoading } = useWishlist();
  const { data, isLoading: loadingProducts } = useQuery({ queryKey: ["wishlist-products", ids], queryFn: () => api.getProductsByIds(ids), enabled: ids.length > 0 });
  if (isLoading || (ids.length > 0 && loadingProducts)) return <ProductGrid loading count={3} />;
  if (!ids.length)
    return <EmptyState icon={<Heart />} title="Your wishlist is empty" body="Tap the heart on any product to save it for later." action={<Button asChild><Link to="/shop">Browse products</Link></Button>} />;
  return <ProductGrid products={data} />;
}

function Security() {
  const { updatePassword } = useAuth();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) });
  const onSubmit = async ({ password }: NewPasswordInput) => {
    try {
      await updatePassword(password);
      reset();
      toast.success("Password updated");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5" noValidate>
      <h2 className="text-2xl">Change password</h2>
      <Field label="New password" error={errors.password?.message}>{(p) => <Input {...p} type="password" autoComplete="new-password" {...register("password")} />}</Field>
      <Field label="Confirm password" error={errors.confirm?.message}>{(p) => <Input {...p} type="password" autoComplete="new-password" {...register("confirm")} />}</Field>
      <Button type="submit" loading={isSubmitting}>Update password</Button>
    </form>
  );
}

export default function Account() {
  usePageMeta({ title: "My account", description: "Your orders, wishlist and settings.", noindex: true });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "orders";
  if (!user) return null;

  const tabClass =
    "h-10 shrink-0 rounded-full px-5 text-sm font-medium text-muted transition-colors hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

  return (
    <div className="container-page pt-10 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 text-4xl md:text-5xl">Hello, {user.fullName.split(" ")[0] || "there"}.</h1>
          <p className="mt-2 text-muted">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && (
            <Button asChild variant="accent" size="sm"><Link to="/admin"><LayoutDashboard /> Admin</Link></Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              toast("Signed out");
              navigate("/");
            }}
          >
            <LogOut /> Sign out
          </Button>
        </div>
      </div>
      <Tabs.Root value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })} className="mt-10">
        <Tabs.List className="flex gap-1 overflow-x-auto border-b border-border pb-4 scrollbar-none" aria-label="Account sections">
          <Tabs.Trigger value="orders" className={tabClass}>Orders</Tabs.Trigger>
          <Tabs.Trigger value="wishlist" className={tabClass}>Wishlist</Tabs.Trigger>
          <Tabs.Trigger value="security" className={tabClass}>Security</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="orders" className="pt-8 focus-visible:outline-none"><Orders userId={user.id} /></Tabs.Content>
        <Tabs.Content value="wishlist" className="pt-8 focus-visible:outline-none"><Wishlist /></Tabs.Content>
        <Tabs.Content value="security" className="pt-8 focus-visible:outline-none"><Security /></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
