import { ContentCard } from "@/components/ui/content-card";
import { FeatureIllustration } from "./feature-illustration";
import type { SchematicKind } from "./schematics";

export const HomeFeatures = () => {
  return (
    <div id="features" className="editorial-section home-features">
      <div className="editorial-section-head">
        <h2>The framework</h2>
        <span aria-hidden="true">II</span>
      </div>
      <p className="editorial-section-intro">
        Everything you need to set up fast, customize with ease, and connect
        your apps.
      </p>
      <div className="site-card-grid">
        {cards.map((card) => (
          <Card key={card.href} {...card} />
        ))}
      </div>
    </div>
  );
};

interface CardProps {
  schematic: SchematicKind;
  title: string;
  description: string;
  href: string;
}

const Card = ({ schematic, title, description, href }: CardProps) => {
  return (
    <ContentCard href={href} media={<FeatureIllustration kind={schematic} />}>
      <h3 className="site-card-title">{title}</h3>
      <p className="site-card-description">{description}</p>
    </ContentCard>
  );
};

const cards: CardProps[] = [
  {
    schematic: "routing",
    title: "File System Routing",
    href: "/docs/getting-started/project-structure",
    description:
      "Automatically register tools, prompts, and resources with zero configuration.",
  },
  {
    schematic: "integrations",
    title: "Integrations",
    href: "/docs/integrations/better-auth",
    description:
      "Secure access with Better Auth's integration and monetize with Polar.",
  },
  {
    schematic: "middleware",
    title: "Middlewares",
    href: "/docs/core-concepts/middlewares",
    description:
      "Add authentication, logging, or custom logic to intercept and process requests and responses.",
  },
  {
    schematic: "configuration",
    title: "Extensible Configuration",
    href: "/docs/configuration/custom-directories",
    description:
      "Customize every aspect of your MCP server with flexible configuration options.",
  },
  {
    schematic: "transport",
    title: "Multiple Transport Support",
    href: "/docs/configuration/transports",
    description:
      "Build and deploy servers with HTTP or STDIO transport protocols out of the box.",
  },
  {
    schematic: "adapter",
    title: "Plug & play to your apps",
    href: "/docs/adapters/nextjs",
    description:
      "Initialize xmcp directly in your existing Next.js or Express projects with one command.",
  },
];
