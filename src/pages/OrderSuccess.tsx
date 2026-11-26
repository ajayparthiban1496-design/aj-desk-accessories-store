import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/queries";
import { usePageMeta } from "@/lib/seo";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { ProductImage } from "@/components/ProductImage";
import { OrderSummaryRows } from "./Cart";
import { formatPrice } from "@/lib/utils";

export default function OrderSuccess() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const token = params.get("t") ?? undefined;
  const cart = useCart();
  usePageMeta({ title: "Order confirmed", description: "Thank you for your order.", noindex: true });

  // Returning from Stripe: the bag is cleared only once payment succeeded.
  useEffect(() => {
    if (params.get("paid") === "1") cart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: qk.order(id),
    queryFn: () => api.getOrder(id, token),
    // The webhook may take a moment to mark the order paid.
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 3000 : false),
  });

  if (isLoading) return <div className="container-page max-w-3xl py-16"><Skeleton className="h-96" /></div>;
  if (isError) return <div className="container-page py-16"><ErrorState onRetry={() => refetch()} /></div>;
  if (!order)
    return (
      <div className="container-page py-16">
        <EmptyState icon={<PackageSearch />} title="Order not found" body="Sign in to see your orders, or contact us with your order number." action={<Button asChild><Link to="/account">My orders</Link></Button>} />
      </div>
    );

  const a = order.shippingAddress;
  return (
    <div className="container-page max-w-3xl pt-12 md:pt-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <h1 className="mt-5 text-4xl md:text-5xl">{order.status === "pending" ? "Confirming your payment…" : "Thank you, your order is in."}</h1>
        <p className="mt-3 text-muted">
          Order <strong className="text-foreground">#{order.orderNumber}</strong> · A confirmation is on its way to {order.email}.
        </p>
      </div>
      <div className="mt-12 rounded-[var(--radius-lg)] bg-surface p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl">Order details</h2>
          <Badge tone={order.status === "pending" ? "warning" : "success"}>{order.status}</Badge>
        </div>
        <ul className="space-y-4 border-b border-border pb-6">
          {order.items.map((i) => (
            <li key={i.variantId} className="flex items-center gap-4">
              <ProductImage src={i.image.replace(/w=\d+/, "w=200")} alt="" className="size-16 rounded-[var(--radius-md)]" />
              <div className="flex-1">
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm text-muted">{i.variantName} · Qty {i.quantity}</p>
              </div>
              <p>{formatPrice(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted">Shipping to</h3>
            <address className="mt-2 not-italic leading-relaxed">
              {a.fullName}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}
            </address>
          </div>
          <OrderSummaryRows subtotal={order.subtotal} shipping={order.shipping} total={order.total} />
        </div>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild><Link to="/shop">Continue shopping</Link></Button>
        <Button asChild variant="outline"><Link to="/account">View my orders</Link></Button>
      </div>
    </div>
  );
}
