import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useAuth } from "@/auth/AuthProvider";
import { categories } from "@/data/products";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

const nav = [
  { to: "/shop", label: "Shop all" },
  { to: "/shop?category=stands", label: "Stands" },
  { to: "/shop?category=mats", label: "Desk Mats" },
  { to: "/shop?category=lighting", label: "Lighting" },
  { to: "/shop?category=organisation", label: "Organisation" },
  { to: "/about", label: "Our story" },
];

export function Header() {
  const { count, open } = useCart();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const isActive = (to: string) => {
    const [path, qs] = to.split("?");
    if (location.pathname !== path) return false;
    return qs ? location.search.includes(qs) : !location.search.includes("category=");
  };

  return (
    <header className={cn("sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300", scrolled ? "border-border bg-background/85 backdrop-blur-lg" : "border-transparent bg-background")}>
      <div className="container-page flex h-16 items-center gap-4 md:h-[72px]">
        <button className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-foreground/5 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <Logo />
        <nav aria-label="Primary" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:text-foreground",
                    isActive(item.to) ? "text-foreground" : "text-muted",
                  )}
                >
                  {item.label}
                  {isActive(item.to) && <span className="absolute inset-x-3.5 -bottom-0.5 h-px bg-accent" />}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
          <button className="grid size-10 place-items-center rounded-full hover:bg-foreground/5" onClick={() => setSearchOpen((s) => !s)} aria-label="Search" aria-expanded={searchOpen}>
            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
          <ThemeToggle className="max-sm:hidden" />
          <Link to={user ? "/account" : "/login"} className="grid size-10 place-items-center rounded-full hover:bg-foreground/5" aria-label={user ? "Your account" : "Sign in"}>
            <User className="size-5" />
          </Link>
          <button className="relative grid size-10 place-items-center rounded-full hover:bg-foreground/5" onClick={open} aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}>
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-accent-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="border-t border-border bg-background">
          <form onSubmit={submitSearch} className="container-page flex items-center gap-3 py-4" role="search">
            <Search className="size-5 text-muted" aria-hidden />
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input
              id="site-search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search laptop stands, desk mats, lights…"
              className="h-11 flex-1 bg-transparent text-lg outline-none placeholder:text-muted/70"
            />
            <kbd className="hidden rounded border border-border px-2 py-0.5 text-xs text-muted sm:block">Enter</kbd>
          </form>
        </div>
      )}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="Menu" side="left">
        <nav aria-label="Mobile" className="px-6 py-6">
          <ul className="space-y-1">
            <li><Link to="/shop" className="block py-3 font-display text-2xl">Shop all</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/shop?category=${c.slug}`} className="block py-3 font-display text-2xl">{c.name}</Link>
              </li>
            ))}
          </ul>
          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-muted">
            <li><Link to="/about">Our story</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/shipping-returns">Shipping & returns</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to={user ? "/account" : "/login"}>{user ? "My account" : "Sign in"}</Link></li>
          </ul>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted">
            <ThemeToggle /> Toggle theme
          </div>
        </nav>
      </Sheet>
    </header>
  );
}
