import { Metadata } from "next";
import { ExampleCardsList } from "@/components/examples/cards/list";
import { ExamplesHeroHeading } from "@/components/examples/cards/hero-heading";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Examples - xmcp",
  description:
    "Explore examples and templates to get started with xmcp. Learn from real-world implementations and best practices.",
  alternates: {
    canonical: "https://xmcp.dev/examples",
  },
};

export default function ExamplesPage() {
  return (
    <main className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
        <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto gap-4 col-span-12 mb-8">
          <ExamplesHeroHeading />
        </div>
        <ExampleCardsList />
      </div>
    </main>
  );
}
