import { useSyncExternalStore } from "react";
import { toast } from "sonner";

/** Saved products, kept on this device (no sign-in needed). */
const KEY = "aj_wishlist";
const listeners = new Set<() => void>();
let cache: string[] = read();

function read(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(next: string[]) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

window.addEventListener("storage", (e) => {
  if (e.key === KEY) {
    cache = read();
    listeners.forEach((l) => l());
  }
});

export function useWishlist() {
  const ids = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cache,
  );
  return {
    ids,
    has: (slug: string) => ids.includes(slug),
    toggle(slug: string) {
      const saved = ids.includes(slug);
      write(saved ? ids.filter((id) => id !== slug) : [...ids, slug]);
      toast.success(saved ? "Removed from your wishlist" : "Saved to your wishlist");
    },
  };
}
