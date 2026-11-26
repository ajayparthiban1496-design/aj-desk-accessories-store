import { useEffect } from "react";

const SITE = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://ajdesk.store";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

interface PageMeta {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
}

/** Sets per-page title, description, canonical and Open Graph tags. */
export function usePageMeta({ title, description, image, noindex }: PageMeta) {
  useEffect(() => {
    const full = title.includes("Aj Desk") ? title : `${title} · Aj Desk`;
    document.title = full;
    setMeta("name", "description", description);
    setMeta("property", "og:title", full);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", SITE + window.location.pathname);
    if (image) setMeta("property", "og:image", image);
    setMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = SITE + window.location.pathname;
  }, [title, description, image, noindex]);
}
