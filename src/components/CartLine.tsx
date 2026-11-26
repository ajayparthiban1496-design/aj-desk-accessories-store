import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { Product, Variant } from "@/types";
import { ProductImage } from "./ProductImage";
import { useCart, MAX_QTY } from "@/store/cart";
import { cn, formatPrice } from "@/lib/utils";

export interface CartLineData {
  productId: string;
  variantId: string;
  quantity: number;
  product: Product;
  variant: Variant;
  lineTotal: number;
}

export function QuantityStepper({ value, onChange, max = MAX_QTY, label }: { value: number; onChange(n: number): void; max?: number; label: string }) {
  return (
    <div className="inline-flex h-10 items-center rounded-full border border-border" role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function CartLine({ line, onNavigate, compact }: { line: CartLineData; onNavigate?: () => void; compact?: boolean }) {
  const cart = useCart();
  const { product, variant } = line;
  const maxQty = Math.min(MAX_QTY, variant.stock);
  return (
    <div className="flex gap-4">
      <Link to={`/products/${product.slug}`} onClick={onNavigate} className="shrink-0">
        <ProductImage src={product.images[0]} alt={product.name} className={cn("rounded-[var(--radius-md)]", compact ? "size-24" : "size-28 md:size-32")} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/products/${product.slug}`} onClick={onNavigate} className="font-semibold hover:text-accent">{product.name}</Link>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <span className="size-3 rounded-full border border-foreground/15" style={{ background: variant.swatch }} aria-hidden />
              {variant.name}
            </p>
            {variant.stock < line.quantity && <p className="mt-1 text-xs text-danger">Only {variant.stock} left — please reduce quantity.</p>}
          </div>
          <p className="shrink-0 font-semibold">{formatPrice(line.lineTotal)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper value={line.quantity} max={maxQty} label={product.name} onChange={(n) => cart.setQuantity(line.productId, line.variantId, n)} />
          <button
            type="button"
            onClick={() => cart.remove(line.productId, line.variantId)}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted transition-colors hover:text-danger"
            aria-label={`Remove ${product.name} from bag`}
          >
            <Trash2 className="size-4" /> <span className="max-sm:sr-only">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
