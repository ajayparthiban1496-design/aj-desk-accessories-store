import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("group flex items-baseline gap-1.5", className)} aria-label="Aj Desk — home">
      <span className="font-display text-[26px] font-medium italic leading-none tracking-tight">Aj</span>
      <span className="text-[13px] font-semibold uppercase tracking-[0.28em] text-muted transition-colors group-hover:text-foreground">Desk</span>
    </Link>
  );
}
