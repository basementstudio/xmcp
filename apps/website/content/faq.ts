import type { FaqItem } from "@/lib/structured-data";

/**
 * High-intent FAQ entries about xmcp. Surfaced as FAQPage structured data and
 * as visually-hidden (but DOM-present, crawlable) content. Refine copy freely.
 */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "What is xmcp?",
    answer:
      "xmcp is a TypeScript framework for building and shipping MCP (Model Context Protocol) applications. It handles the boilerplate of defining tools, resources, and prompts so you can focus on functionality.",
  },
  {
    question: "How do I create a new xmcp project?",
    answer:
      "Run `npx create-xmcp-app` to scaffold a new project, or `npx init-xmcp` to add xmcp to an existing application. Both set up the framework with current xmcp APIs and conventions.",
  },
  {
    question: "What transports does xmcp support?",
    answer:
      "xmcp supports both STDIO and HTTP transports. STDIO is typical for local MCP clients, while HTTP is used for remote and serverless deployments. Stateless HTTP keeps each request self-contained without relying on server-side session state.",
  },
  {
    question: "How do I define a tool in xmcp?",
    answer:
      "Add a file to your tools directory exporting a tool definition with its input schema and handler. xmcp automatically discovers and registers it — there is no need to wrap or manually register each tool.",
  },
  {
    question: "Can I add authentication to my MCP server?",
    answer:
      "Yes. xmcp supports authentication strategies such as API keys and OAuth-style flows. For stateless HTTP, any client metadata a tool needs must be sent on the current request, for example via repeated headers.",
  },
  {
    question: "Where can I deploy an xmcp application?",
    answer:
      "xmcp applications can be deployed to platforms like Vercel or any Node.js host. The HTTP adapter works with serverless and edge environments, and integrations such as Next.js are supported.",
  },
  {
    question: "Is xmcp open source?",
    answer:
      "Yes. xmcp is open source and developed in the open at github.com/basementstudio/xmcp. You can read the documentation, browse examples, and contribute.",
  },
];
