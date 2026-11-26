import { Link } from "react-router-dom";
import { ArrowRight, Lock, ShoppingBag } from "lucide-react";
import type { CartTotals } from "@/types";
import { useCart } from "@/store/cart";
import { usePageMeta } from "@/lib/seo";
import { CartLine, PromoCodeForm } from "@/components/CartLine";
import { FreeShippingMeter } from "@/components/layout/CartDrawer";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { formatPrice } from "@/lib/utils";

/** Totals exactly as Medusa calculated them. `shippingKnown` is false until a delivery method is chosen. */
export function OrderSummaryRows({ totals, shippingKnown = true }: { totals: CartTotals; shippingKnown?: boolean }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(totals.itemTotal)}</dd></div>
      {totals.discountTotal > 0 && (
        <div className="flex justify-between text-success"><dt>Discount</dt><dd>−{formatPrice(totals.discountTotal)}</dd></div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Shipping</dt>
        <dd>{!shippingKnown ? <span className="text-muted">At checkout</span> : totals.shippingTotal === 0 ? <span className="text-success">Free</span> : formatPrice(totals.shippingTotal)}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-4 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(totals.total)}</dd></div>
      <p className="text-xs text-muted">Includes {formatPrice(totals.taxTotal)} GST.</p>
    </dl>
  );
}

export default function Cart() {
  const cart = useCart();
  const { lines, totals, isLoading, isError } = cart;
  usePageMeta({ title: "Your bag", description: "Review the items in your bag before checkout.", noindex: true });

  return (
    <div className="container-page pt-10 md:pt-14">
      <h1 className="text-4xl md:text-5xl">Your bag</h1>
      {isLoading ? (
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">{[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}</div>
          <Skeleton className="h-64 lg:col-span-4" />
        </div>
      ) : isError ? (
        <div className="mt-10"><ErrorState message="We couldn't load your bag." onRetry={cart.refetch} /></div>
      ) : lines.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<ShoppingBag />} title="Your bag is empty" body="Find something that makes your desk a little better." action={<Button asChild><Link to="/shop">Shop the collection</Link></Button>} />
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <FreeShippingMeter subtotal={totals.itemTotal} />
            <ul className="mt-6 divide-y divide-border border-y border-border" aria-busy={cart.isUpdating}>
              {lines.map((l) => <li key={l.id} className="py-6"><CartLine line={l} /></li>)}
            </ul>
            <Link to="/shop" className="mt-6 inline-block text-sm text-muted underline-offset-4 hover:underline">← Continue shopping</Link>
          </div>
          <aside className="lg:col-span-4" aria-label="Order summary">
            <div className="space-y-6 rounded-[var(--radius-lg)] bg-surface p-6 lg:sticky lg:top-28">
              <h2 className="text-2xl">Summary</h2>
              <PromoCodeForm />
              <OrderSummaryRows totals={totals} shippingKnown={(cart.cart?.shipping_methods ?? []).length > 0} />
              <Button asChild size="lg" className="w-full" disabled={!cart.canOrder}>
                <Link to="/checkout">Checkout <ArrowRight /></Link>
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><Lock className="size-3" /> Secure checkout · pay on delivery</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
