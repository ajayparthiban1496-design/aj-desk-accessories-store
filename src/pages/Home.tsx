import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Leaf, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, SectionHeading } from "@/components/ui/misc";
import { Accordion } from "@/components/ui/accordion";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Reveal } from "@/components/Reveal";
import { useCategories, useProducts } from "@/lib/queries";
import { usePageMeta } from "@/lib/seo";
import { IMG } from "@/data/products";
import { faqs, usps } from "@/data/content";
import { formatPrice, unsplash } from "@/lib/utils";

function Hero() {
  return (
    <section className="container-page pt-6 md:pt-10">
      <div className="grid items-stretch gap-4 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-[var(--radius-xl)] bg-surface p-8 md:p-12 lg:col-span-5">
          <div>
            <p className="eyebrow">The Autumn Edit · 2026</p>
            <h1 className="mt-5 text-[2.75rem] leading-[1.02] md:text-6xl xl:text-[4.25rem]">
              A calmer desk <em className="font-light text-accent">is a sharper mind.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Laptop stands, desk mats, lighting and organisers in walnut, aluminium and merino felt — designed to disappear into your day and last for a decade.
            </p>
          </div>
          <div className="mt-10">
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/shop">Shop the collection <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#setups">Explore setups</a>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
              <div className="flex -space-x-2" aria-hidden>
                {["#6b4429", "#a46a34", "#c9a272", "#3a3a3a"].map((c) => (
                  <span key={c} className="size-8 rounded-full border-2 border-surface" style={{ background: c }} />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">Walnut · Oak · Aluminium · Merino felt</p>
                <p className="mt-0.5 text-xs text-muted">Pay on delivery · 30-day returns · Up to 5-year warranty</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative min-h-[420px] overflow-hidden rounded-[var(--radius-xl)] lg:col-span-7 lg:min-h-[640px]">
          <ProductImage
            src={unsplash(IMG.heroDesk, 1600)}
            alt="A walnut desk with a laptop on a stand, lit by a warm lamp in the evening"
            fetchPriority="high"
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <Link
            to="/products/arc-aluminium-laptop-stand"
            className="group absolute bottom-5 left-5 right-5 flex items-center gap-4 rounded-[var(--radius-lg)] bg-surface/90 p-3 pr-5 backdrop-blur-md transition-transform hover:-translate-y-0.5 sm:right-auto"
          >
            <ProductImage src={unsplash(IMG.laptopStand, 200)} alt="" className="size-14 shrink-0 rounded-[var(--radius-md)]" />
            <div>
              <p className="text-xs text-muted">Featured in this setup</p>
              <p className="font-semibold">Arc Aluminium Laptop Stand</p>
              <p className="text-sm text-accent">{formatPrice(349900)}</p>
            </div>
            <ArrowUpRight className="ml-2 size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { data: categories = [] } = useCategories();
  return (
    <section className="container-page mt-24 md:mt-32">
      <SectionHeading
        eyebrow="Shop by category"
        title="Everything your desk is missing."
        action={
          <Button asChild variant="outline">
            <Link to="/shop">View all products</Link>
          </Button>
        }
      />
      {/* Focusable scroller: on mobile, ←/→ scroll it once it has keyboard focus. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Categories, scroll horizontally"
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 scrollbar-none focus-visible:outline-offset-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0"
      >
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.05} className="w-[68%] shrink-0 snap-start sm:w-[40%] md:w-auto">
            <Link to={`/shop?category=${c.slug}`} className="group block">
              <ProductImage src={c.image} alt={c.name} className="aspect-[3/4] rounded-[var(--radius-lg)] [&_img]:group-hover:scale-105" sizes="(min-width: 768px) 20vw, 68vw" />
              <h3 className="mt-4 flex items-center justify-between font-sans text-base font-semibold tracking-normal">
                {c.name}
                <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="text-sm text-muted">{c.description}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Bestsellers() {
  const { data, isLoading, isError, refetch } = useProducts({ sort: "featured" });
  return (
    <section className="container-page mt-24 md:mt-32">
      <SectionHeading eyebrow="Bestsellers" title="The pieces most setups start with." body="Stands, mats and light: the three changes you notice in the first week." />
      {isError ? <ErrorState onRetry={() => refetch()} /> : <ProductGrid products={data?.slice(0, 8)} loading={isLoading} />}
    </section>
  );
}

function Story() {
  const points = [
    { icon: Leaf, title: "Honest materials", body: "FSC-certified hardwoods, recycled aluminium, merino wool. No plastic veneers pretending to be wood." },
    { icon: ShieldCheck, title: "Built for a decade", body: "Up to 5 years of warranty, because a desk accessory should outlast the laptop on it." },
    { icon: PackageCheck, title: "Plastic-free packaging", body: "Every order ships in recycled card and paper tape, packed by hand in our Chennai studio." },
  ];
  return (
    <section className="container-page mt-24 md:mt-32">
      <div className="grid overflow-hidden rounded-[var(--radius-xl)] bg-primary text-primary-foreground dark:bg-surface dark:text-foreground lg:grid-cols-2">
        <ProductImage src={unsplash(IMG.warmLamp, 1400)} alt="A warm desk lamp glowing beside a laptop at dusk" className="min-h-[320px] lg:min-h-[560px]" sizes="(min-width: 1024px) 50vw, 100vw" />
        <div className="flex flex-col justify-center p-8 md:p-14">
          <p className="eyebrow !text-accent">Why Aj Desk</p>
          <h2 className="mt-4 text-3xl leading-tight md:text-5xl">Fewer, better things on your desk.</h2>
          <p className="mt-5 max-w-lg text-primary-foreground/70 dark:text-muted">
            We started Aj Desk after years of working from cluttered tables and buying accessories that wobbled, peeled and ended up in landfill. So we made our own.
          </p>
          <ul className="mt-10 space-y-6">
            {points.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-foreground/10 text-accent dark:bg-accent-soft">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-sans text-base font-semibold tracking-normal">{title}</h3>
                  <p className="mt-1 text-sm text-primary-foreground/70 dark:text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/about" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">
            Read our story <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Setups() {
  const setups = [
    {
      title: "The Focus Setup",
      body: "Arc stand, merino felt mat and Halo light bar — our most-loved combination for long days.",
      img: unsplash(IMG.brightDesk, 1200),
      href: "/shop?category=stands",
      price: "From ₹11,497",
    },
    {
      title: "The Evening Setup",
      body: "Walnut riser, Ember glow lamp and Dock tray for warm, unhurried late sessions.",
      img: unsplash(IMG.laptopWood, 1200),
      href: "/shop?category=lighting",
      price: "From ₹9,797",
    },
  ];
  return (
    <section id="setups" className="container-page mt-24 scroll-mt-24 md:mt-32">
      <SectionHeading eyebrow="How it works" title="Build your setup in three steps." />
      <ol className="mb-12 grid gap-6 md:grid-cols-3">
        {[
          ["Lift", "Raise your screen to eye level with a stand or riser — your neck will notice in a week."],
          ["Ground", "Add a mat to soften sound, warm the surface and define your working zone."],
          ["Light", "Finish with glare-free light so evenings feel as focused as mornings."],
        ].map(([t, b], i) => (
          <li key={t} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <span className="font-display text-4xl italic text-accent">0{i + 1}</span>
            <h3 className="mt-3 text-2xl">{t}</h3>
            <p className="mt-2 text-muted">{b}</p>
          </li>
        ))}
      </ol>
      <div className="grid gap-4 md:grid-cols-2">
        {setups.map((s) => (
          <Link key={s.title} to={s.href} className="group relative block overflow-hidden rounded-[var(--radius-xl)]">
            <ProductImage src={s.img} alt={s.title} className="aspect-[4/3] [&_img]:group-hover:scale-[1.03]" sizes="(min-width: 768px) 50vw, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <p className="text-sm text-white/70">{s.price}</p>
              <h3 className="mt-1 text-3xl">{s.title}</h3>
              <p className="mt-2 max-w-md text-sm text-white/80">{s.body}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Shop the setup <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Usps() {
  const icons = [Truck, RotateCcw, ShieldCheck, PackageCheck];
  return (
    <section aria-label="Our promises" className="container-page mt-24">
      <ul className="grid grid-cols-2 gap-6 rounded-[var(--radius-xl)] border border-border p-6 md:grid-cols-4 md:p-10">
        {usps.map((u, i) => {
          const Icon = icons[i];
          return (
            <li key={u.title} className="flex flex-col gap-3 md:flex-row md:items-start">
              <Icon className="size-6 shrink-0 text-accent" aria-hidden />
              <div>
                <p className="font-semibold">{u.title}</p>
                <p className="text-sm text-muted">{u.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HomeFaq() {
  return (
    <section className="container-page mt-24 grid gap-10 md:mt-32 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-3 text-3xl md:text-[2.75rem] md:leading-[1.1]">Questions, answered.</h2>
        <p className="mt-4 text-muted">
          Can't find what you need? <Link to="/contact" className="text-foreground underline underline-offset-4">Write to us</Link> — a real person replies within a day.
        </p>
      </div>
      <div className="lg:col-span-8">
        <Accordion items={faqs.slice(0, 6).map((f, i) => ({ id: String(i), title: f.q, content: f.a }))} />
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-page mt-24 md:mt-32">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-accent-soft px-6 py-16 text-center md:py-24">
        <p className="eyebrow">Free shipping over ₹1,999</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-4xl leading-tight md:text-6xl">Your best work deserves a better desk.</h2>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link to="/shop">Start shopping <ArrowRight /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta({
    title: "Aj Desk — Premium Desk Accessories, Crafted for Focus",
    description: "Laptop stands, desk mats, monitor lights and organisers in walnut, aluminium and felt. Free shipping across India over ₹1,999 and 30-day returns.",
  });
  return (
    <>
      <Hero />
      <Categories />
      <Bestsellers />
      <Story />
      <Setups />
      <Usps />
      <HomeFaq />
      <FinalCta />
    </>
  );
}
