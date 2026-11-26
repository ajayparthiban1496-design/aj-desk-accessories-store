import type { ReactNode } from "react";
import { ProductImage } from "@/components/ProductImage";
import { IMG } from "@/data/products";
import { unsplash } from "@/lib/utils";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="container-page grid gap-10 pt-10 md:pt-14 lg:grid-cols-2 lg:items-center">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        <p className="mt-3 text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
      <ProductImage src={unsplash(IMG.whiteDesk, 1200)} alt="A bright minimalist desk setup" className="hidden aspect-[4/5] rounded-[var(--radius-xl)] lg:block" sizes="50vw" />
    </div>
  );
}

