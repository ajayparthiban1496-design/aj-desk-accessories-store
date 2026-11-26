import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, Star } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "./button";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-[var(--radius-md)] bg-surface-2", className)} aria-hidden {...props} />;
}

export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "dark" }) {
  const tones = {
    neutral: "bg-surface-2 text-foreground",
    accent: "bg-accent-soft text-accent",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/10 text-danger",
    dark: "bg-primary text-primary-foreground",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", tones[tone], className)} {...props} />;
}

export function Rating({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const px = size === "sm" ? "size-3.5" : "size-4.5";
  return (
    <div className="flex items-center gap-1.5" aria-label={`Rated ${value.toFixed(1)} out of 5${count ? `, ${count} reviews` : ""}`}>
      <div className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(px, i <= Math.round(value) ? "fill-accent text-accent" : "fill-transparent text-foreground/20")} />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-muted">{value.toFixed(1)} · {count.toLocaleString("en-IN")}</span>}
    </div>
  );
}

export function Price({ price, compareAt, className }: { price: number; compareAt?: number | null; className?: string }) {
  const onSale = compareAt && compareAt > price;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold">{formatPrice(price)}</span>
      {onSale && (
        <>
          <s className="text-sm text-muted" aria-label={`was ${formatPrice(compareAt)}`}>{formatPrice(compareAt)}</s>
          <span className="text-xs font-semibold text-success">{Math.round((1 - price / compareAt) * 100)}% off</span>
        </>
      )}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-xl)] border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-full bg-accent-soft text-accent [&_svg]:size-6">{icon}</div>
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-2 max-w-sm text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong while loading this.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-[var(--radius-xl)] border border-danger/20 bg-danger/5 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 size-6 text-danger" aria-hidden />
      <p className="font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, body, align = "left", action }: { eyebrow?: string; title: ReactNode; body?: string; align?: "left" | "center"; action?: ReactNode }) {
  return (
    <div className={cn("mb-10 flex flex-col gap-4 md:mb-14", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="max-w-2xl text-3xl leading-[1.1] md:text-[2.75rem]">{title}</h2>
        {body && <p className="mt-4 max-w-xl text-muted md:text-lg">{body}</p>}
      </div>
      {action}
    </div>
  );
}
