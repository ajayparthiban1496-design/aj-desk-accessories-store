import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Truck } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { CartLine } from "@/components/CartLine";
import { useCart } from "@/store/cart";
import { useCartDetails } from "@/store/useCartDetails";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/utils";

export function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <div className="rounded-[var(--radius-md)] bg-surface-2 p-4">
      <p className="flex items-center gap-2 text-sm">
        <Truck className="size-4 text-accent" aria-hidden />
        {remaining > 0 ? (
          <span>
            You're <strong>{formatPrice(remaining)}</strong> away from free shipping
          </span>
        ) : (
          <span><strong>You've unlocked free shipping.</strong></span>
        )}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Progress to free shipping">
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const cart = useCart();
  const { lines, subtotal, isLoading, isError, refetch } = useCartDetails();
  const navigate = useNavigate();

  const go = (path: string) => {
    cart.close();
    navigate(path);
  };

  return (
    <Sheet
      open={cart.isOpen}
      onOpenChange={(o) => (o ? cart.open() : cart.close())}
      title={`Your bag${cart.count ? ` (${cart.count})` : ""}`}
      footer={
        lines.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted">Taxes included. Shipping calculated at checkout.</p>
            <Button className="w-full" size="lg" onClick={() => go("/checkout")}>Checkout</Button>
            <Button variant="link" className="w-full text-sm" onClick={() => go("/cart")}>View bag</Button>
          </div>
        )
      }
    >
      <div className="space-y-6 px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4"><Skeleton className="size-24" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" /></div></div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="We couldn't load your bag." onRetry={() => refetch()} />
        ) : lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag />}
            title="Your bag is empty"
            body="Start with a bestseller — most setups begin with a stand and a mat."
            action={<Button onClick={() => go("/shop")}>Browse the collection</Button>}
          />
        ) : (
          <>
            <FreeShippingMeter subtotal={subtotal} />
            <ul className="divide-y divide-border">
              {lines.map((l) => (
                <li key={l.variantId} className="py-4 first:pt-0">
                  <CartLine line={l} onNavigate={cart.close} compact />
                </li>
              ))}
            </ul>
            <Link to="/shop" onClick={cart.close} className="block text-center text-sm text-muted underline-offset-4 hover:underline">
              Continue shopping
            </Link>
          </>
        )}
      </div>
    </Sheet>
  );
}
