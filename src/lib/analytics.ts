/**
 * Analytics hook-in point. Plausible is cookieless, so no consent banner is
 * strictly needed for it; if you switch to GA4, gate `initAnalytics` behind
 * the cookie notice's "accept" choice.
 */
declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number> }) => void;
  }
}

export function initAnalytics() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  if (!domain || document.getElementById("plausible")) return;
  const s = document.createElement("script");
  s.id = "plausible";
  s.defer = true;
  s.dataset.domain = domain;
  s.src = "https://plausible.io/js/script.js";
  document.head.appendChild(s);
}

export function track(event: string, props?: Record<string, string | number>) {
  window.plausible?.(event, props ? { props } : undefined);
}
