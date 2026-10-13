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
}

const Card = ({ asset, title, description }: CardProps) => {
  return (
    <div className="editorial-feature">
      <div className="flex items-center justify-center w-full gap-2 mb-4">
        <Image
          src={asset}
          alt={title}
          className="mx-auto feature-art"
          width={245}
          height={200}
          sizes="245px"
          placeholder="blur"
        />
      </div>
      <h3 className="text-brand-white mt-auto text-lg">{title}</h3>
      <p className="text-brand-neutral-100 pt-1">{description}</p>
    </div>
  );
};

const cards = [
  {
    asset: Feature1,
    title: "File System Routing",
    description:
      "Automatically register tools, prompts, and resources with zero configuration.",
  },
  {
    asset: Feature2,
    title: "Integrations",
    description:
      "Secure access with Better Auth's integration and monetize with Polar.",
  },
  {
    asset: Feature3,
    title: "Middlewares",
    description:
      "Add authentication, logging, or custom logic to intercept and process requests and responses.",
  },
  {
    asset: Feature4,
    title: "Extensible Configuration",
    description:
      "Customize every aspect of your MCP server with flexible configuration options.",
  },

  {
    asset: Feature5,
    title: "Multiple Transport Support",
    description:
      "Build and deploy servers with HTTP or STDIO transport protocols out of the box.",
  },

  {
    asset: Feature6,
    title: "Plug & play to your apps",
    description:
      "Initialize xmcp directly in your existing Next.js or Express projects with one command.",
  },
];
