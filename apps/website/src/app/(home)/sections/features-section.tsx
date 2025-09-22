const features = [
  {
    title: "File System Routing",
    description: "Tools are auto-registered from a `tools/` directory",
  },
  {
    title: "Hot Reloading",
    description: "Instant development feedback",
  },
  {
    title: "Middlewares",
    description: "Toolkit for shipping authentication and custom middlewares",
  },
  {
    title: "Extensible Configuration",
    description: "Customizable configuration for your MCP server",
  },
  {
    title: "Deploy Anywhere",
    description: "Flexible deployment across any platform",
  },
  {
    title: "Vercel Support",
    description: "Deploy-ready for Vercel out of the box",
  },
];

export function FeaturesSection() {
  return (
    <div className="space-y-16">
      <h2 className="w-full mx-auto text-xl uppercase">Features</h2>
      <ul className="text-left space-y-4 text-pretty">
        {features.map((feature) => (
          <Feature
            key={feature.title}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </ul>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <li className="relative text-base">
      <span className="text-white items-center gap-2">
        <span className="absolute -left-4 font-bold">⊹ </span>
        {title}
      </span>{" "}
      - {description}
    </li>
  );
}
