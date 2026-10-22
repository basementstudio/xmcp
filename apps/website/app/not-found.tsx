import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <main id="main-content" className="site-page-grid">
      <section
        className="flex min-h-[60svh] flex-col justify-center gap-6 py-16"
        aria-labelledby="not-found-title"
      >
        <div className="listing-intro">
          <p className="eyebrow">404 / Page not found</p>
          <h1 id="not-found-title" className="display">
            This page isn’t here.
          </h1>
          <p className="listing-description">
            It may have moved, or the link might be incorrect. Head back home or
            find what you need in the documentation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            className="min-h-11 focus-visible:ring-2 focus-visible:ring-brand-white focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
            asChild
          >
            <Link href="/">Go back home</Link>
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 focus-visible:ring-2 focus-visible:ring-brand-white focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
            asChild
          >
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
