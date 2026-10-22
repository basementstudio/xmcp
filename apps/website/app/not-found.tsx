import { Button } from "@/components/ui/button";
import { PrefooterArtwork } from "@/components/layout/prefooter";
import Link from "next/link";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <main id="main-content" className="site-page-grid site-not-found">
      <section
        className="flex flex-col items-center justify-center gap-[clamp(12px,3dvh,32px)] text-center"
        aria-labelledby="not-found-title"
      >
        <PrefooterArtwork />
        <div className="flex flex-col items-center gap-4">
          <h1 id="not-found-title" className="display text-balance">
            This page isn’t here.
          </h1>
          <p className="listing-description max-w-md text-balance">
            It may have moved, or the link might be incorrect. Head back home or
            find what you need in the documentation.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
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
