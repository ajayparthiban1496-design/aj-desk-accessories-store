import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { Heart, LogOut, MailCheck, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { listMyOrders } from "@/lib/medusa/checkout";
import { toOrder } from "@/lib/medusa/mappers";
import { qk, useProducts } from "@/lib/queries";
import { usePageMeta } from "@/lib/seo";
import { useWishlist } from "@/store/wishlist";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

/** A shopper-friendly status from Medusa's order, payment and fulfilment states. */
export function orderStatus(o: Order): { label: string; tone: "warning" | "success" | "accent" | "neutral" | "danger" } {
  if (o.status === "canceled") return { label: "Cancelled", tone: "danger" };
  if (o.fulfillmentStatus === "delivered") return { label: "Delivered", tone: "success" };
  if (["shipped", "partially_shipped"].includes(o.fulfillmentStatus)) return { label: "Shipped", tone: "accent" };
  if (o.status === "completed") return { label: "Completed", tone: "success" };
  return { label: "Confirmed", tone: "neutral" };
}

function Orders({ userId }: { userId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: qk.myOrders(userId), queryFn: async () => (await listMyOrders()).map(toOrder) });
  if (isLoading) return <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.length)
    return <EmptyState icon={<Package />} title="No orders yet" body="When you place an order while signed in, you can track it here." action={<Button asChild><Link to="/shop">Start shopping</Link></Button>} />;
  return (
    <ul className="space-y-4">
      {data.map((o) => {
        const status = orderStatus(o);
        return (
          <li key={o.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Order #{o.orderNumber}</p>
                <p className="text-sm text-muted">{formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} items · {formatPrice(o.totals.total)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={status.tone}>{status.label}</Badge>
                <Button asChild variant="outline" size="sm"><Link to={`/order/${o.id}`}>Details</Link></Button>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {o.items.slice(0, 5).map((i) => (
                <ProductImage key={i.id} src={i.image.replace(/w=\d+/, "w=200")} alt={i.name} className="size-14 rounded-[var(--radius-sm)]" />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Wishlist() {
  const { ids } = useWishlist();
  const { data, isLoading } = useProducts();
  if (isLoading) return <ProductGrid loading count={3} />;
  const saved = (data ?? []).filter((p) => ids.includes(p.slug));
  if (!saved.length)
    return <EmptyState icon={<Heart />} title="Your wishlist is empty" body="Tap the heart on any product to save it on this device." action={<Button asChild><Link to="/shop">Browse products</Link></Button>} />;
  return <ProductGrid products={saved} />;
}

function Security({ email }: { email: string }) {
  const { sendPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-2xl">Change password</h2>
      {sent ? (
        <p className="flex items-start gap-2 rounded-[var(--radius-md)] bg-surface p-4 text-sm" role="status">
          <MailCheck className="mt-0.5 size-4 text-accent" /> We've sent a link to {email}. Open it to choose a new password.
        </p>
      ) : (
        <>
          <p className="text-muted">For your security we'll email you a link to set a new password.</p>
          <Button onClick={send} loading={busy}>Email me a reset link</Button>
        </>
      )}
    </div>
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
      <Tabs.Root value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })} className="mt-10">
        <Tabs.List className="flex gap-1 overflow-x-auto border-b border-border pb-4 scrollbar-none" aria-label="Account sections">
          <Tabs.Trigger value="orders" className={tabClass}>Orders</Tabs.Trigger>
          <Tabs.Trigger value="wishlist" className={tabClass}>Wishlist</Tabs.Trigger>
          <Tabs.Trigger value="security" className={tabClass}>Security</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="orders" className="pt-8 focus-visible:outline-none"><Orders userId={user.id} /></Tabs.Content>
        <Tabs.Content value="wishlist" className="pt-8 focus-visible:outline-none"><Wishlist /></Tabs.Content>
        <Tabs.Content value="security" className="pt-8 focus-visible:outline-none"><Security email={user.email} /></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
