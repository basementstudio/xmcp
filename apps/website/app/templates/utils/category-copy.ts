export interface CategoryCopy {
  title: string;
  description: string;
  prerequisites: string;
  links: { label: string; href: string }[];
}

const categories: Record<string, CategoryCopy> = {
  integration: {
    title: "MCP service integration templates",
    description:
      "Connect an MCP server to an external service with runnable TypeScript tools. Choose a template for the API your workflow needs, then adapt its operations and permissions to your users.",
    prerequisites:
      "You'll need Node.js 22 or later, an account with the selected service, and its API credentials. Follow the template's environment-variable setup and review write operations before connecting clients.",
    links: [
      { label: "Integration setup guides", href: "/docs/integrations" },
      {
        label: "Build a TypeScript MCP server",
        href: "/blog/build-mcp-server-typescript",
      },
    ],
  },
  authentication: {
    title: "Authenticated MCP server templates",
    description:
      "Start with a server that verifies client identity before tools run. Choose the provider that matches your existing accounts and authorization requirements, then add access checks for your own data.",
    prerequisites:
      "You'll need Node.js 22 or later, credentials for your chosen identity provider, and its callback URLs configured for your deployment.",
    links: [
      { label: "Authentication setup", href: "/docs/guides/authentication" },
      {
        label: "Compare authentication approaches",
        href: "/blog/mcp-server-authentication",
      },
    ],
  },
  chatgpt: {
    title: "ChatGPT MCP app templates",
    description:
      "Build tools and interactive interfaces for ChatGPT with an MCP server. Use these starting points when your workflow needs a rendered interface alongside tool results.",
    prerequisites:
      "You'll need Node.js 22 or later and an MCP client with app rendering support. Configure a reachable HTTPS endpoint when connecting a remote client.",
    links: [
      { label: "MCP apps", href: "/docs/core-concepts/mcp-apps" },
      { label: "Connecting clients", href: "/docs/getting-started/connecting" },
    ],
  },
  framework: {
    title: "MCP templates for web frameworks",
    description:
      "Add MCP tools to an existing web application so they can reuse your services and data access. Choose the adapter that matches your framework and deploy it with the application.",
    prerequisites:
      "You'll need Node.js 22 or later, a supported framework project, and a plan for authenticating requests to its MCP endpoint.",
    links: [
      { label: "Next.js adapter", href: "/docs/adapters/nextjs" },
      { label: "Express adapter", href: "/docs/adapters/express" },
    ],
  },
  http: {
    title: "HTTP MCP server templates",
    description:
      "Create a remotely accessible MCP endpoint for multiple clients. xmcp's stateless HTTP transport keeps request handling independent of previous server instances, supporting container and serverless deployments.",
    prerequisites:
      "You'll need Node.js 22 or later, a client that supports Streamable HTTP, and authentication before exposing private tools to the internet.",
    links: [
      { label: "Configure transports", href: "/docs/configuration/transports" },
      {
        label: "Choose a deployment",
        href: "/blog/deploy-mcp-server-production",
      },
    ],
  },
  monetization: {
    title: "Paid MCP tool templates",
    description:
      "Gate access to MCP tools with payment or license checks. Choose a per-call payment model or product access model based on how customers use your tools and which payment flows their clients support.",
    prerequisites:
      "You'll need Node.js 22 or later and the payment-provider credentials or wallet configuration required by the selected template. Test access denials before using live payments.",
    links: [
      { label: "Monetization guide", href: "/docs/guides/monetization" },
      {
        label: "Compare payment models",
        href: "/blog/how-to-monetize-mcp-server",
      },
    ],
  },
  ui: {
    title: "Interactive MCP UI templates",
    description:
      "Return an interactive interface with your tool results. Start here for workflows where people need to inspect data, adjust inputs, or act on a result inside a compatible MCP client.",
    prerequisites:
      "You'll need Node.js 22 or later and a client that supports the UI format used by the template. Keep a useful text result for clients without rendering support.",
    links: [
      { label: "UI rendering", href: "/docs/guides/ui-rendering" },
      { label: "MCP apps reference", href: "/docs/core-concepts/mcp-apps" },
    ],
  },
};

export function getCategoryCopy(slug: string, label: string): CategoryCopy {
  return (
    categories[slug] ?? {
      title: `${label} MCP server templates`,
      description: `Start an xmcp project for ${label} with these runnable TypeScript examples. Compare the included tools and services to choose a starting point for your application.`,
      prerequisites:
        "Use Node.js 22 or later and follow the selected template's setup instructions for its service credentials.",
      links: [
        { label: "Installation", href: "/docs/getting-started/installation" },
        { label: "MCP guides", href: "/guides" },
      ],
    }
  );
}
