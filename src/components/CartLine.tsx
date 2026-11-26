import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Tag, Trash2, X } from "lucide-react";
import type { CartLine as CartLineData } from "@/types";
import { ProductImage } from "./ProductImage";
import { useCart, MAX_QTY } from "@/store/cart";
import { cn, formatPrice } from "@/lib/utils";

export function QuantityStepper({ value, onChange, max = MAX_QTY, label, disabled }: { value: number; onChange(n: number): void; max?: number; label: string; disabled?: boolean }) {
  return (
    <div className="inline-flex h-10 items-center rounded-full border border-border" role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Decrease quantity">
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function CartLine({ line, onNavigate, compact }: { line: CartLineData; onNavigate?: () => void; compact?: boolean }) {
  const cart = useCart();
  const variant = line.product?.variants.find((v) => v.id === line.variantId);
  const stock = variant?.stock ?? null;
  const maxQty = stock === null ? MAX_QTY : Math.min(MAX_QTY, Math.max(stock, line.quantity));
  const href = line.product ? `/products/${line.product.slug}` : "/shop";
  const image = line.product?.images[0] ?? line.thumbnail;
  return (
    <div className="flex gap-4">
      <Link to={href} onClick={onNavigate} className="shrink-0">
        <ProductImage src={image} alt={line.title} className={cn("rounded-[var(--radius-md)]", compact ? "size-24" : "size-28 md:size-32")} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link to={href} onClick={onNavigate} className="font-semibold hover:text-accent">{line.title}</Link>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              {variant && <span className="size-3 rounded-full border border-foreground/15" style={{ background: variant.swatch }} aria-hidden />}
              {line.variantTitle}
            </p>
            {stock !== null && stock < line.quantity && <p className="mt-1 text-xs text-danger">Only {stock} left — please reduce the quantity.</p>}
          </div>
          <p className="shrink-0 font-semibold">{formatPrice(line.total)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper value={line.quantity} max={maxQty} label={line.title} onChange={(n) => cart.setQuantity(line.id, n)} />
          <button
            type="button"
            onClick={() => cart.remove(line.id)}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted transition-colors hover:text-danger"
            aria-label={`Remove ${line.title} from bag`}
          >
            <Trash2 className="size-4" /> <span className="max-sm:sr-only">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Promotion codes created in Medusa Admin -> Promotions. */
export function PromoCodeForm() {
  const cart = useCart();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    if (await cart.applyPromo(code)) setCode("");
    setBusy(false);
  };
  return (
    <div className="space-y-2">
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="promo-code" className="sr-only">Promo code</label>
        <input
          id="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Promo code"
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-sm uppercase placeholder:normal-case placeholder:text-muted/70 focus:border-accent focus:outline-none"
        />
        <button type="submit" disabled={busy || !code.trim()} className="h-10 rounded-full border border-foreground/15 px-4 text-sm font-semibold hover:bg-foreground/5 disabled:opacity-50">
          {busy ? "Applying…" : "Apply"}
        </button>
      </form>
      {cart.promoCodes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {cart.promoCodes.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => cart.removePromo(c)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-xs font-semibold text-accent"
                aria-label={`Remove promo code ${c}`}
              >
                <Tag className="size-3.5" /> {c} <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
