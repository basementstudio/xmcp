import { Metadata } from "next";
import { ExampleCardsList } from "../../components/examples/cards/list";

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
          <h1 className="display text-center text-balance z-10 text-gradient">
            Examples & templates
          </h1>
          <p className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto text-center">
            Quickstart guides and examples to get you started with xmcp with
            real-world implementations and best practices.
          </p>
        </div>
        <ExampleCardsList />
      </div>
    </main>
  );
}
