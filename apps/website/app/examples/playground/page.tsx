import type { Metadata } from "next";
import { ExampleCard } from "@/components/examples/cards/cards";
import type { ExampleItem } from "@/app/examples/utils/github";

export const metadata: Metadata = {
  title: "Examples Playground - xmcp",
  description: "Temporary playground for example card fallback previews.",
};

const cards: ExampleItem[] = [
  {
    kind: "example",
    slug: "playground-nextjs",
    name: "Playground Next.js",
    description: "Fallback test for nextjs.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-nextjs",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "nextjs",
    tags: ["next.js"],
  },
  {
    kind: "example",
    slug: "playground-auth0",
    name: "Playground Auth0",
    description: "Fallback test for auth0.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-auth0",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "auth0",
    tags: ["http"],
  },
  {
    kind: "example",
    slug: "playground-clerk",
    name: "Playground Clerk",
    description: "Fallback test for clerk.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-clerk",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "clerk",
    tags: ["http"],
  },
  {
    kind: "example",
    slug: "playground-cloudflare",
    name: "Playground Cloudflare",
    description: "Fallback test for cloudflare.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-cloudflare",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "cloudflare",
    tags: ["workers"],
  },
  {
    kind: "example",
    slug: "playground-express",
    name: "Playground Express",
    description: "Fallback test for express.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-express",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "express",
    tags: ["adapter"],
  },
  {
    kind: "example",
    slug: "playground-nestjs",
    name: "Playground NestJS",
    description: "Fallback test for nestjs.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-nestjs",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "nestjs",
    tags: ["adapter"],
  },
  {
    kind: "example",
    slug: "playground-betterauth",
    name: "Playground Better Auth",
    description: "Fallback test for betterauth.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-betterauth",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "better-auth",
    tags: ["http"],
  },
  {
    kind: "example",
    slug: "playground-polar",
    name: "Playground Polar",
    description: "Fallback test for polar.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-polar",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "polar",
    tags: ["payments"],
  },
  {
    kind: "example",
    slug: "playground-react",
    name: "Playground React",
    description: "Fallback test for react.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-react",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "react",
    tags: ["ui"],
  },
  {
    kind: "example",
    slug: "playground-tailwind",
    name: "Playground Tailwind",
    description: "Fallback test for tailwind.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-tailwind",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "tailwind",
    tags: ["ui"],
  },
  {
    kind: "example",
    slug: "playground-workos",
    name: "Playground WorkOS",
    description: "Fallback test for workos.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-workos",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "workos",
    tags: ["http"],
  },
  {
    kind: "example",
    slug: "playground-global-fallback",
    name: "Playground Global Fallback",
    description: "Fallback test for fallback.svg",
    repositoryUrl: "https://github.com/basementstudio/xmcp",
    path: "examples/playground-global-fallback",
    sourceRepo: "basementstudio/xmcp",
    sourceBranch: "main",
    category: "unknown-provider",
    tags: ["none"],
  },
];

export default function ExamplesPlaygroundPage() {
  return (
    <main className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4 py-10">
      <div className="col-span-12 space-y-3">
        <h1 className="heading-2 text-gradient">Examples Fallback Playground</h1>
        <p className="text-sm text-brand-neutral-100">
          Temporary page to validate card fallback SVG fitting.
        </p>
      </div>

      <section className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((item) => (
          <ExampleCard key={item.slug} {...item} />
        ))}
      </section>
    </main>
  );
}
