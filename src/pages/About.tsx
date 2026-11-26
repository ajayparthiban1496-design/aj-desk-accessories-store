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
  ["Designed in India, for Indian desks", "Chosen for humid monsoons, compact apartments and long workdays, and priced in rupees with GST included."],
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
        <h2 className="text-3xl md:text-4xl lg:col-span-4">Made for the desk you actually work at.</h2>
        <div className="space-y-5 text-lg leading-relaxed text-muted lg:col-span-7 lg:col-start-6">
          <p>
            Most desk accessories are either flimsy or imported at a price that makes little sense. Stands wobble, mats peel, and the beautiful options take weeks to arrive.
          </p>
          <p>
            Aj Desk makes a small range of pieces that do one job well: solid materials, honest prices, quick delivery across India, and a warranty that assumes they'll last.
          </p>
          <p>The goal is simple: a desk that feels calm the moment you sit down at it.</p>
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
          <h2 className="text-3xl md:text-4xl">Try it at your desk, risk-free.</h2>
          <p className="mt-4 text-muted">Pay when it arrives, live with it for 30 days, and send it back with a free pickup if it isn't right. Wood and aluminium pieces carry up to 5 years of warranty.</p>
          <Button asChild size="lg" className="mt-8"><Link to="/shop">Shop the collection <ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
