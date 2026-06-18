import type { FaqItem } from "@/lib/structured-data";

/**
 * High-intent FAQ entries about xmcp, grounded in the documentation under
 * `content/docs`. Surfaced as FAQPage structured data and as visually-hidden
 * (but DOM-present, crawlable) content. Keep answers accurate to current docs.
 */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "What is xmcp?",
    answer:
      "xmcp is a TypeScript framework for building and shipping MCP (Model Context Protocol) applications. It handles the boilerplate of defining tools, resources, and prompts — auto-discovering them from your project — so you can focus on functionality and ship AI tools on top of the MCP ecosystem.",
  },
  {
    question: "How do I create a new xmcp project?",
    answer:
      "The quickest way is `npx create-xmcp-app@latest`, which scaffolds a project and lets you pick a package manager, transport (HTTP or STDIO), and which components (tools, prompts, resources) to include. To add xmcp to an existing app you can run `npx init-xmcp@latest`, or install manually with `npm i xmcp zod@^3.25.76`. xmcp requires Node.js 20 or later.",
  },
  {
    question: "What are tools, resources, and prompts in xmcp?",
    answer:
      "Tools are functions the LLM can call to perform actions (auto-discovered from `src/tools`). Resources are read-only data sources that provide context (auto-discovered from `src/resources`). Prompts are user-controlled, parameterized instruction templates (auto-discovered from `src/prompts`). You don't register them manually — xmcp discovers them from the file system.",
  },
  {
    question: "How do I define a tool in xmcp?",
    answer:
      "Add a file to `src/tools` that exports an optional `schema` (Zod) describing inputs, an optional `metadata` object (name, description, annotations), and a default async function that handles the call. The clear description is what helps the LLM decide when to use the tool. You can scaffold one with `xmcp create tool my-tool`.",
  },
  {
    question: "What transports does xmcp support?",
    answer:
      "xmcp supports HTTP and STDIO transports. HTTP is stateless and suited to remote/serverless deployments — it defaults to port 3001 and the `/mcp` endpoint, and each request must carry its own context. STDIO runs on the user's machine and is typical for local clients like Claude Desktop or Cursor.",
  },
  {
    question: "Is xmcp's HTTP transport stateful or stateless?",
    answer:
      "HTTP is stateless: the server does not retain per-client session memory between requests. Any client metadata a tool needs after initialization must be repeated on the current request, for example via headers such as `x-mcp-client-name` and `x-mcp-client-version`.",
  },
  {
    question: "How do I add authentication to my MCP server?",
    answer:
      "xmcp ships middleware for API key and JWT authentication, and the Next.js adapter supports OAuth via `withAuth`. You can also integrate dedicated providers including Auth0, Better Auth, Clerk, Scalekit, and WorkOS.",
  },
  {
    question: "Which frameworks can I integrate xmcp with?",
    answer:
      "xmcp provides adapters for Next.js, Express, Fastify, and NestJS, so you can add an MCP server to an existing application or run it standalone.",
  },
  {
    question: "Where can I deploy an xmcp application?",
    answer:
      "xmcp deploys to Vercel with zero configuration, and also supports Cloudflare, Replit, and ALPIC. Because it builds to a standard Node.js server, the HTTP transport runs on any Node-compatible host.",
  },
  {
    question: "Can I charge for my MCP tools?",
    answer:
      "Yes. xmcp integrates with Polar for license-key based monetization and with x402 for pay-per-call payments in USDC on Base, so agents can pay for tool usage programmatically.",
  },
  {
    question: "How do I make my xmcp server discoverable to LLMs and registries?",
    answer:
      "The docs site exposes `/llms.txt` (a markdown index) and `/llms-full.txt` (full documentation) for LLM consumption, and xmcp servers can be published to the Smithery registry for distribution.",
  },
  {
    question: "Is xmcp open source?",
    answer:
      "Yes. xmcp is open source and developed in the open at github.com/basementstudio/xmcp, where you can read the docs, browse examples, and contribute.",
  },
];
