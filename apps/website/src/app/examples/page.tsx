import { Metadata } from "next";
import { ExampleCards } from "@/components/examples/cards";

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
    <div className="font-mono min-h-[calc(100vh-12rem)] flex justify-center">
      <div className="max-w-[1100px] w-full mx-auto flex flex-col px-8 py-16 gap-16">
        <div className="text-center max-w-[40rem] mx-auto">
          <h1 className="text-2xl font-medium tracking-tight text-white mb-4">
            Examples & Templates
          </h1>
          <p className="text-[#BABABA] text-[1rem]">
            Get started quickly with these examples and templates. Each example
            demonstrates different features and use cases of xmcp.
          </p>
        </div>

        <ExampleCards />
      </div>
    </div>
  );
}
