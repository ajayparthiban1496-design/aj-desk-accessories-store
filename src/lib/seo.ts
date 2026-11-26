import { useEffect } from "react";
import { BASE_PATH } from "@/lib/utils";

const SITE = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://ajdesk.store").replace(/\/$/, "");

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
    // VITE_SITE_URL already includes any sub-path, so strip it from the router path.
    const pageUrl = SITE + (window.location.pathname.slice(BASE_PATH.length) || "/");
    setMeta("property", "og:url", pageUrl);
    if (image) setMeta("property", "og:image", image);
    setMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = pageUrl;
  }, [title, description, image, noindex]);
}
