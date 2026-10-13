import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import Feature1 from "./feature-1.jpg";
import Feature2 from "./feature-2.jpg";
import Feature3 from "./feature-3.jpg";
import Feature4 from "./feature-4.jpg";
import Feature5 from "./feature-5.jpg";
import Feature6 from "./feature-6.jpg";

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
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

interface CardProps {
  asset: StaticImageData;
  title: string;
  description: string;
  href: string;
}

const Card = ({ asset, title, description, href }: CardProps) => {
  return (
    <Link
      href={href}
      className="group block h-full min-w-0 text-left rounded-xl"
    >
      <div className="site-card-surface relative overflow-hidden h-full w-full flex flex-col">
        <div className="flex items-center justify-center w-full aspect-video border-b border-brand-neutral-500 group-hover:border-brand-neutral-300 group-focus-visible:border-brand-neutral-300 transition-colors duration-200 overflow-hidden">
          <Image
            src={asset}
            alt=""
            className="feature-art h-full w-auto object-contain"
            width={245}
            height={200}
            sizes="245px"
            placeholder="blur"
          />
        </div>
        <div className="flex flex-col gap-2 p-4">
          <h3 className="site-card-title">{title}</h3>
          <p className="site-card-description">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const cards = [
  {
    asset: Feature1,
    title: "File System Routing",
    href: "/docs/getting-started/project-structure",
    description:
      "Automatically register tools, prompts, and resources with zero configuration.",
  },
  {
    asset: Feature2,
    title: "Integrations",
    href: "/docs/integrations/better-auth",
    description:
      "Secure access with Better Auth's integration and monetize with Polar.",
  },
  {
    asset: Feature3,
    title: "Middlewares",
    href: "/docs/core-concepts/middlewares",
    description:
      "Add authentication, logging, or custom logic to intercept and process requests and responses.",
  },
  {
    asset: Feature4,
    title: "Extensible Configuration",
    href: "/docs/configuration/custom-directories",
    description:
      "Customize every aspect of your MCP server with flexible configuration options.",
  },

  {
    asset: Feature5,
    title: "Multiple Transport Support",
    href: "/docs/configuration/transports",
    description:
      "Build and deploy servers with HTTP or STDIO transport protocols out of the box.",
  },

  {
    asset: Feature6,
    title: "Plug & play to your apps",
    href: "/docs/adapters/nextjs",
    description:
      "Initialize xmcp directly in your existing Next.js or Express projects with one command.",
  },
];
