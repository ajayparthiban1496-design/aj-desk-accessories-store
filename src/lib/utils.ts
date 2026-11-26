import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Formats paise as rupees, e.g. 349900 → ₹3,499 */
export function formatPrice(paise: number) {
  return inr.format(Math.round(paise / 100));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Display only: drives the "away from free shipping" meter. The actual charge
 * comes from Medusa's shipping option (free from ₹1,999 there too).
 */
export const FREE_SHIPPING_THRESHOLD = 199900;

export function unsplash(id: string, w = 1200) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;
}

export function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Base path the app is served from ("" at a domain root, "/repo-name" on GitHub Pages). */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
