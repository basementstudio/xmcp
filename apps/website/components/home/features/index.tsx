import { Tag } from "../../ui/tag";
import Image from "next/image";
import Feature1 from "./feature-1.png";
import Feature2 from "./feature-2.png";
import Feature3 from "./feature-3.png";
import Feature4 from "./feature-4.png";
import Feature5 from "./feature-5.png";
import Feature6 from "./feature-6.png";
import { Icons } from "@/components/icons";

export const Features = () => {
  return (
    <div className="col-span-12 grid grid-cols-12 gap-[20px]">
      <div className="flex flex-col items-start justify-center col-span-9 col-start-2 w-full mx-auto mb-8 gap-4">
        <Tag text="Features" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-center gap-4 md:gap-8 w-full">
          <h2 className="heading-2 text-balance">
            The complete stack to ship an MCP server
          </h2>
          <p className="text-brand-neutral-100 text-base md:mt-auto">
            Everything you need to set up fast, customize with ease, and plug
            directly into your apps.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[20px] col-span-12">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

interface CardProps {
  icon: React.ReactNode;
  asset: string;
  title: string;
  description: string;
}

const Card = ({ icon, asset, title, description }: CardProps) => {
  return (
    <div className="flex flex-col items-start justify-center p-4 rounded-xs border border-brand-neutral-500 max-h-[360px] h-full">
      <div className="p-1 bg-brand-neutral-600 text-[0.625rem] md:text-xs border border-dashed border-brand-neutral-400 z-10 mb-auto">
        {icon}
      </div>
      <div className="flex items-center justify-center w-full gap-2 -translate-y-8">
        <Image
          src={asset}
          alt={title}
          className="mx-auto"
          width={245}
          height={200}
        />
      </div>
      <h3 className="text-brand-white">{title}</h3>
      <p className="text-brand-neutral-100">{description}</p>
    </div>
  );
};

const cards = [
  {
    icon: <Icons.folders />,
    asset: Feature1.src,
    title: "File System Routing",
    description: "Tools are auto-registered from a `tools/` directory",
  },
  {
    icon: <Icons.links />,
    asset: Feature2.src,
    title: "Integrations",
    description:
      "Roll your auth with Better Auth's integration and monetize your server with Polar",
  },
  {
    icon: <Icons.puzzle />,
    asset: Feature3.src,
    title: "Middlewares",
    description:
      "Easily add built-in authentication solutions or your custom logic to intercept requests and responses.",
  },
  {
    icon: <Icons.settings />,
    asset: Feature4.src,
    title: "Extensible Configuration",
    description: "Customizable configuration for your MCP server",
  },

  {
    icon: <Icons.global />,
    asset: Feature5.src,
    title: "Multiple Transport Support",
    description: "Easily build HTTP and STDIO servers",
  },

  {
    icon: <Icons.plug />,
    asset: Feature6.src,
    title: "Plug & play to your apps",
    description:
      "Initialize an xmcp application in your current Next.js or Express project",
  },
];
