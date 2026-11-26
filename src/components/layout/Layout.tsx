import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { Button } from "@/components/ui/button";

function AnnouncementBar() {
  return (
    <div className="bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground">
      <p className="container-page py-2.5 text-center text-xs font-medium tracking-wide">
        Free shipping across India over ₹1,999 · 30-day returns ·{" "}
        <Link to="/shop?category=lighting" className="underline underline-offset-2">New: Halo light bar</Link>
      </p>
    </div>
  );
}

function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!localStorage.getItem("aj-cookie-choice"));
  }, []);
  const choose = (v: "accepted" | "essential") => {
    localStorage.setItem("aj-cookie-choice", v);
    setShow(false);
  };
  if (!show) return null;
  return (
    <div role="region" aria-label="Cookie notice" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-lift)] md:left-6 md:right-auto">
      <p className="text-sm text-muted">
        We use essential cookies to keep your bag and session working, and privacy-friendly analytics to improve the store. Read our{" "}
        <Link to="/privacy" className="text-foreground underline underline-offset-2">privacy policy</Link>.
      </p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => choose("accepted")}>Accept</Button>
        <Button size="sm" variant="outline" onClick={() => choose("essential")}>Essential only</Button>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading page">
      <Loader2 className="size-6 animate-spin text-muted" />
    </div>
  );
}

export function Layout() {
  return (
    <>
      <a href="#main" className="sr-only z-[60] rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main id="main" className="min-h-[60vh]">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <CookieNotice />
    </>
  );
}
