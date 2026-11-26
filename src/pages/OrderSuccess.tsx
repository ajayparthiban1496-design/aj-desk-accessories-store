import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { HttpTypes } from "@medusajs/types";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { getOrder } from "@/lib/medusa/checkout";
import { toOrder } from "@/lib/medusa/mappers";
import { qk } from "@/lib/queries";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { ProductImage } from "@/components/ProductImage";
import { OrderSummaryRows } from "./Cart";
import { formatPrice } from "@/lib/utils";

export default function OrderSuccess() {
  const { id = "" } = useParams();
  const location = useLocation();
  const fromCheckout = (location.state as { order?: HttpTypes.StoreOrder } | null)?.order;
  usePageMeta({ title: "Order confirmed", description: "Thank you for your order.", noindex: true });

  const { data, isLoading } = useQuery({
    queryKey: qk.order(id),
    queryFn: () => getOrder(id),
    initialData: fromCheckout?.id === id ? fromCheckout : undefined,
    retry: false,
  });

  if (isLoading) return <div className="container-page max-w-3xl py-16"><Skeleton className="h-96" /></div>;
  if (!data)
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<PackageSearch />}
          title="We couldn't show this order"
          body="Sign in to see your orders, or contact us with your order number and we'll help."
          action={<Button asChild><Link to="/account">My orders</Link></Button>}
        />
      </div>
    );

  const order = toOrder(data);
  const a = order.shippingAddress;
  return (
    <div className="container-page max-w-3xl pt-12 md:pt-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <h1 className="mt-5 text-4xl md:text-5xl">Thank you, your order is in.</h1>
        <p className="mt-3 text-muted">
          Order <strong className="text-foreground">#{order.orderNumber}</strong> · We'll call {a.phone || "you"} to confirm before dispatch.
        </p>
      </div>
      <div className="mt-12 rounded-[var(--radius-lg)] bg-surface p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl">Order details</h2>
          <Badge tone="warning">Pay on delivery</Badge>
        </div>
        <ul className="space-y-4 border-b border-border pb-6">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4">
              <ProductImage src={i.image.replace(/w=\d+/, "w=200")} alt="" className="size-16 rounded-[var(--radius-md)]" />
              <div className="flex-1">
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm text-muted">{i.variantName} · Qty {i.quantity}</p>
              </div>
              <p>{formatPrice(i.total)}</p>
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
          <OrderSummaryRows totals={order.totals} />
        </div>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild><Link to="/shop">Continue shopping</Link></Button>
        <Button asChild variant="outline"><Link to="/account">View my orders</Link></Button>
      </div>
    </div>
  );
}
