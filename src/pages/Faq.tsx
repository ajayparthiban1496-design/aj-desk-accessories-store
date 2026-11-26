import { Link } from "react-router-dom";
import { faqs } from "@/data/content";
import { usePageMeta } from "@/lib/seo";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const groups = ["Orders", "Shipping", "Returns", "Products"] as const;

export default function Faq() {
  usePageMeta({ title: "FAQ", description: "Answers about delivery times, returns, warranty, payment methods and product care at Aj Desk." });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="container-page pt-12 md:pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="eyebrow">Help centre</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Frequently asked questions</h1>
      <div className="mt-14 space-y-14">
        {groups.map((g) => (
          <section key={g} className="grid gap-6 lg:grid-cols-12" aria-labelledby={`faq-${g}`}>
            <h2 id={`faq-${g}`} className="text-2xl lg:col-span-3">{g}</h2>
            <div className="lg:col-span-9">
              <Accordion items={faqs.filter((f) => f.group === g).map((f, i) => ({ id: `${g}-${i}`, title: f.q, content: f.a }))} />
            </div>
          </section>
        ))}
      </div>
      <div className="mt-20 rounded-[var(--radius-xl)] bg-surface p-10 text-center">
        <h2 className="text-3xl">Still have a question?</h2>
        <p className="mt-2 text-muted">Our team replies within one working day.</p>
        <Button asChild className="mt-6"><Link to="/contact">Contact us</Link></Button>
      </div>
    </div>
  );
}
