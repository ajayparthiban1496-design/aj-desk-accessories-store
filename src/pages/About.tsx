import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePageMeta } from "@/lib/seo";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { IMG } from "@/data/products";
import { unsplash } from "@/lib/utils";

const values = [
  ["Less, but better", "We'd rather make twelve excellent things than a hundred forgettable ones. Every product earns its place on our shelf — and yours."],
  ["Materials that age well", "Solid walnut deepens, aluminium stays true, merino felt softens. We choose materials that get better with use, not worse."],
  ["Designed in India, for Indian desks", "Built for humid monsoons, compact apartments and long workdays. Tested in Chennai, Bengaluru and Mumbai home offices."],
  ["Honest pricing", "No inflated MRPs, no permanent 'sale'. Our prices reflect what it costs to make something properly."],
];

export default function About() {
  usePageMeta({
    title: "Our story",
    description: "Aj Desk designs premium desk accessories in Chennai — fewer, better things made from walnut, aluminium and merino felt.",
  });
  return (
    <>
      <section className="container-page pt-12 md:pt-20">
        <p className="eyebrow">Our story</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-[1.02] md:text-7xl">
          We make the quiet objects <em className="font-light text-accent">that help you do loud work.</em>
        </h1>
      </section>
      <section className="container-page mt-14">
        <ProductImage src={unsplash(IMG.heroDesk, 1800)} alt="A calm wooden workspace in warm evening light" className="aspect-[16/8] rounded-[var(--radius-xl)]" sizes="100vw" />
      </section>
      <section className="container-page mt-20 grid gap-10 lg:grid-cols-12">
        <h2 className="text-3xl md:text-4xl lg:col-span-4">Started at a kitchen table in Chennai.</h2>
        <div className="space-y-5 text-lg leading-relaxed text-muted lg:col-span-7 lg:col-start-6">
          <p>
            Aj Desk began in 2023, when our founder spent a year working from a dining table with a laptop propped up on cookbooks. Every stand we bought wobbled. Every mat peeled. The beautiful options were imported, expensive and took weeks to arrive.
          </p>
          <p>
            So we started making our own — first for friends, then for their colleagues, and now for more than 12,000 desks across India. We work with a small network of machinists, woodworkers and textile makers, and we test every product for months before it launches.
          </p>
          <p>The goal hasn't changed: a desk that feels calm the moment you sit down at it.</p>
        </div>
      </section>
      <section className="container-page mt-24">
        <div className="grid gap-4 md:grid-cols-2">
          {values.map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.05}>
              <div className="h-full rounded-[var(--radius-lg)] bg-surface p-8">
                <span className="font-display text-3xl italic text-accent">0{i + 1}</span>
                <h3 className="mt-3 text-2xl">{t}</h3>
                <p className="mt-2 text-muted">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="container-page mt-24 grid items-center gap-10 lg:grid-cols-2">
        <ProductImage src={unsplash(IMG.tableFlatlay, 1200)} alt="Desk essentials laid out on a round table" className="aspect-[4/3] rounded-[var(--radius-xl)]" sizes="50vw" />
        <div>
          <h2 className="text-3xl md:text-4xl">12,000+ desks. 4.8★ average. 2% return rate.</h2>
          <p className="mt-4 text-muted">The numbers we're proudest of aren't sales — they're how rarely things come back, and how often customers return for a second piece.</p>
          <Button asChild size="lg" className="mt-8"><Link to="/shop">Shop the collection <ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
