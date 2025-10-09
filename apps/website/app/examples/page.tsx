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
    <div className="font-mono min-h-[calc(100vh-12rem)] flex justify-center">
      <div className="flex-1 pt-10 px-4 lg:px-0 box-content max-w-6xl mx-auto">
        <div className="text-start w-full">
          <div className="max-w-[40rem] prose">
            <h1 className="text-white uppercase font-medium">
              Examples & Templates
            </h1>
            <p className="text-[#BABABA]">
              Get started quickly with these examples and templates.
              <br />
              Each example demonstrates different features and use cases of
              xmcp.
            </p>
          </div>
        </div>

        <ExampleCardsList />
      </div>
    </div>
  );
}
