import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Lazy image with a warm gradient placeholder that fades out on load,
 * and a graceful fallback if the remote image fails.
 */
export function ProductImage({ className, src, alt, sizes = "(min-width: 1024px) 25vw, 50vw", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  // Responsive srcset for large Unsplash images only; thumbnails (w ≤ 200) keep their single small src.
  const requestedWidth = typeof src === "string" ? Number(/[?&]w=(\d+)/.exec(src)?.[1] ?? 0) : 0;
  const srcSet =
    typeof src === "string" && src.includes("images.unsplash.com") && requestedWidth > 200
      ? [400, 800, 1200].map((w) => `${src.replace(/w=\d+/, `w=${w}`)} ${w}w`).join(", ")
      : undefined;
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-surface-2 to-accent-soft", className)}>
      {state !== "error" ? (
        <img
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className={cn("size-full object-cover transition-[opacity,transform] duration-500 ease-[var(--ease-out-soft)]", state === "ok" ? "opacity-100" : "opacity-0")}
          {...props}
        />
      ) : (
        <div className="grid size-full place-items-center font-display text-2xl italic text-accent/60" role="img" aria-label={alt}>
          Aj
        </div>
      )}
    </div>
  );
}
