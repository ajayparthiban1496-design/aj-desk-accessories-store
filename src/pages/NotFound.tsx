import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  usePageMeta({ title: "Page not found", description: "The page you're looking for doesn't exist.", noindex: true });
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-[8rem] italic leading-none text-accent/30 md:text-[12rem]">404</p>
        <h1 className="mt-2 text-4xl md:text-5xl">This page wandered off the desk.</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">The link may be broken or the page may have moved. Let's get you back somewhere useful.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild><Link to="/">Go home</Link></Button>
          <Button asChild variant="outline"><Link to="/shop">Shop all products</Link></Button>
        </div>
      </div>
    </div>
  );
}
