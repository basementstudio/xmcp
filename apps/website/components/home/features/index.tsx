import Link from "next/link";
import {
  FolderTree,
  ShieldCheck,
  Workflow,
  SlidersHorizontal,
  Cable,
  Blocks,
} from "lucide-react";

const capabilities = [
  {
    icon: FolderTree,
    title: "A file is all it takes.",
    description:
      "Add a file. Export a function. Your tools, resources, and prompts are automatically registered.",
    href: "/docs/getting-started/project-structure",
  },
  {
    icon: ShieldCheck,
    title: "Access, on your terms.",
    description:
      "Connect your authentication provider and control who can use your server.",
    href: "/docs/guides/authentication",
  },
  {
    icon: Workflow,
    title: "Make the request yours.",
    description:
      "Add authentication, logging, and custom logic with middleware in the request flow.",
    href: "/docs/core-concepts/middlewares",
  },
  {
    icon: SlidersHorizontal,
    title: "Room to make it fit.",
    description:
      "Configure your server, infer input types, and choose how your project is organized.",
    href: "/docs/configuration/server-info",
  },
  {
    icon: Cable,
    title: "Local or on the network.",
    description:
      "Serve over HTTP or connect through STDIO. Use the transport your clients need.",
    href: "/docs/configuration/transports",
  },
  {
    icon: Blocks,
    title: "At home in your app.",
    description:
      "Bring MCP to an existing application with adapters for Next.js, Express, and more.",
    href: "/docs/adapters/nextjs",
  },
];

export function HomeFeatures() {
  return (
    <section className="col-span-12 py-12 md:py-16">
      <div className="home-section-heading">
        <div>
          <p className="eyebrow">01 / Built for the way you work</p>
          <h2 className="heading-2">
            The framework around
            <br />
            your functions.
          </h2>
        </div>
        <p>
          Start with the code you know. Add the pieces you need as your server
          grows.
        </p>
      </div>
      <div className="capability-grid">
        {capabilities.map(({ icon: Icon, ...item }) => (
          <Link key={item.href} href={item.href}>
            <Icon aria-hidden="true" />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
