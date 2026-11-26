import type { ReactNode } from "react";
import { ProductImage } from "@/components/ProductImage";
import { IMG } from "@/data/products";
import { unsplash } from "@/lib/utils";
import { isDemoMode } from "@/lib/supabase";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="container-page grid gap-10 pt-10 md:pt-14 lg:grid-cols-2 lg:items-center">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        <p className="mt-3 text-muted">{subtitle}</p>
        {isDemoMode && (
          <p className="mt-4 rounded-[var(--radius-md)] bg-accent-soft px-4 py-3 text-xs text-accent">
            Demo mode: accounts are stored in this browser only. Sign up with an email beginning with <strong>admin@</strong> to explore the admin dashboard.
          </p>
        )}
        <div className="mt-8">{children}</div>
      </div>
      <ProductImage src={unsplash(IMG.whiteDesk, 1200)} alt="A bright minimalist desk setup" className="hidden aspect-[4/5] rounded-[var(--radius-xl)] lg:block" sizes="50vw" />
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}
