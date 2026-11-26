import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Newsletter } from "@/components/Newsletter";
import { isDemoMode } from "@/lib/supabase";

const cols = [
  {
    title: "Shop",
    links: [
      ["All products", "/shop"],
      ["Stands & risers", "/shop?category=stands"],
      ["Desk mats", "/shop?category=mats"],
      ["Lighting", "/shop?category=lighting"],
      ["Organisation", "/shop?category=organisation"],
    ],
  },
  {
    title: "Help",
    links: [
      ["FAQ", "/faq"],
      ["Shipping & returns", "/shipping-returns"],
      ["Contact us", "/contact"],
      ["Track an order", "/account"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Our story", "/about"],
      ["Corporate orders", "/contact?topic=Corporate%20orders"],
      ["Privacy policy", "/privacy"],
      ["Terms of service", "/terms"],
    ],
  },
] as const;

function Social({ label, href, path }: { label: string; href: string; path: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" aria-label={label} className="grid size-10 place-items-center rounded-full border border-primary-foreground/15 transition-colors hover:bg-primary-foreground/10">
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden><path d={path} /></svg>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground dark:bg-surface dark:text-foreground">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <h2 className="font-display text-3xl leading-tight md:text-4xl">Letters from the studio.</h2>
          <p className="mt-3 max-w-sm text-primary-foreground/70 dark:text-muted">
            New releases, setup tours and the occasional members-only offer. Twice a month, never spam.
          </p>
          <Newsletter className="mt-6 max-w-md" dark />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7 md:pl-10">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/50 dark:text-muted">{c.title}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {c.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="text-primary-foreground/85 transition-colors hover:text-primary-foreground dark:text-foreground/85 dark:hover:text-foreground">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 dark:border-border">
        <div className="container-page flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <Logo className="[&_span:last-child]:text-primary-foreground/60 dark:[&_span:last-child]:text-muted" />
            <p className="text-xs text-primary-foreground/50 dark:text-muted">© {new Date().getFullYear()} Aj Desk Accessories. Designed in Chennai.</p>
          </div>
          <div className="flex items-center gap-2">
            <Social label="Instagram" href="https://instagram.com" path="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.1-9.4a1.2 1.2 0 1 0 0 2.3 1.2 1.2 0 0 0 0-2.3z" />
            <Social label="YouTube" href="https://youtube.com" path="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
            <Social label="X (Twitter)" href="https://x.com" path="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.4 5.5-6.4zm-1.2 17.9h1.9L7.1 4.2H5.1l11.9 16z" />
          </div>
        </div>
        {isDemoMode && (
          <p className="pb-6 text-center text-[11px] text-primary-foreground/40 dark:text-muted">
            Demo mode — data is stored in this browser. Connect Supabase to go live.
          </p>
        )}
      </div>
    </footer>
  );
}
