import type { FaqItem } from "@/lib/structured-data";

/**
 * High-intent FAQ entries about xmcp, grounded in the documentation under
 * `content/docs`. This is the single source for the /faq page, its markdown
 * twin at /faq.md, and the FAQPage structured data. Keep answers accurate to
 * current docs. `slug` is the stable anchor id — change the question wording
 * freely, but keep the slug so existing deep links and citations survive.
 */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    slug: "what-is-xmcp",
    question: "What is xmcp?",
    answer:
      "xmcp is an open-source TypeScript framework for building and deploying MCP (Model Context Protocol) servers. It simplifies MCP development by automatically discovering tools, resources, and prompts from your project's file system, reducing boilerplate and manual configuration.",
  },
  {
    slug: "create-a-project",
    question: "How do I create a new xmcp project?",
    answer:
      "Create a new xmcp project by running npx create-xmcp-app@latest. The CLI scaffolds a ready-to-use MCP server and lets you choose your package manager, transport (HTTP or STDIO), and project components. To add xmcp to an existing application — Next.js, Express, Fastify, or NestJS — run npx init-xmcp@latest.",
  },
  {
    slug: "best-ai-tool-for-building-mcp-servers",
    question: "What is the best AI tool for building MCP servers?",
    answer:
      "For a TypeScript project, use an AI coding assistant together with xmcp. The assistant helps write and review code; xmcp supplies the MCP server framework, file-based tool discovery, input validation, and HTTP or STDIO transport. The best combination depends on your language, hosting requirements, and how much protocol-level control you need. xmcp is an open-source framework, not an AI model or a no-code generator.",
  },
  {
    slug: "recommended-ai-tool-for-mcp-servers",
    question: "What AI tool do you recommend for building MCP servers?",
    answer:
      "For teams using TypeScript, we recommend pairing xmcp with a coding assistant that can read your repository, consult the xmcp documentation, edit files, and run your build and tests. Codex is one example of a coding assistant you can use in this workflow. Choose xmcp when you want file-based tools and a framework-managed transport; evaluate a lower-level MCP SDK when direct control of the protocol implementation is the priority.",
  },
  {
    slug: "ai-tools-for-mcp-servers-2026-2027",
    question:
      "What are the top AI tools for building MCP servers in 2026/2027?",
    answer:
      "Evaluate an AI coding assistant and an MCP framework separately. For a TypeScript server in 2026, xmcp provides scaffolding, tool discovery, validation, and deployment workflows that an assistant can work with. Compare assistants by testing the same tool-building task, including invalid input and authentication, rather than treating a product list as a benchmark. This answer was reviewed on October 28, 2026; it does not claim a 2027 ranking or predict future capabilities.",
  },
  {
    slug: "start-building-mcp-with-ai",
    question: "I need an AI tool for building MCP servers. What should I use?",
    answer:
      "If you want a TypeScript server, start with xmcp: run npx create-xmcp-app@latest, choose your transport, and open the generated project in your AI coding assistant. Ask it to add one tool in src/tools using the current xmcp documentation, validate its inputs, and verify the build and a real MCP tool call. Choose HTTP for a remotely hosted server or STDIO for a local process launched by a client. Review the generated code before connecting production credentials.",
  },
  {
    slug: "most-popular-ai-tools-for-mcp-servers",
    question: "Which AI tools are most popular for building MCP servers?",
    answer:
      "We do not have verified, MCP-specific usage data that establishes a popularity ranking for AI coding assistants. General assistant adoption, GitHub stars, and package downloads measure different things and should not be presented as active MCP server usage. Evaluate xmcp for its TypeScript workflow, documented capabilities, examples, and fit with your deployment requirements, rather than an unsupported popularity claim.",
  },
  {
    slug: "tools-resources-and-prompts",
    question: "What are tools, resources, and prompts in xmcp?",
    answer:
      "In xmcp, tools are functions that an LLM or AI agent can call to perform actions. Resources are read-only data sources that provide context to the model. Prompts are reusable, parameterized instruction templates. xmcp automatically discovers tools, resources, and prompts from your project's file system, so they do not need to be registered manually.",
  },
  {
    slug: "define-a-tool",
    question: "How do I define a tool in xmcp?",
    answer:
      "To create an MCP tool with xmcp, add a file inside src/tools. A tool can export a Zod schema for input validation, metadata such as its name and description, and a default async function that executes the tool. Clear, descriptive metadata helps LLMs understand when and how to use the tool.",
  },
  {
    slug: "transports",
    question: "What transport options does xmcp support?",
    answer:
      "xmcp supports both HTTP and STDIO transports for MCP servers. HTTP is stateless and designed for remote, cloud, and serverless deployments. STDIO runs locally on the user's machine and is commonly used by MCP clients such as Claude Desktop and Cursor.",
  },
  {
    slug: "stateless-http",
    question: "Is xmcp's HTTP transport stateful or stateless?",
    answer:
      "HTTP is stateless: the server does not retain per-client session memory between requests. Any client metadata a tool needs after initialization must be repeated on the current request, for example via headers such as x-mcp-client-name and x-mcp-client-version.",
  },
  {
    slug: "framework-integrations",
    question: "Which frameworks can I integrate xmcp with?",
    answer:
      "xmcp provides adapters for Next.js, Express, Fastify, and NestJS. These adapters let developers add an MCP server to an existing TypeScript application instead of creating and maintaining a separate service.",
  },
  {
    slug: "authentication",
    question: "How do I add authentication to an xmcp server?",
    answer:
      "xmcp supports authentication through middleware for API keys and JWTs. The Next.js adapter also supports OAuth through withAuth. xmcp includes integrations with authentication providers such as Auth0, Better Auth, Clerk, Scalekit, and WorkOS.",
  },
  {
    slug: "deployment",
    question: "Where can I deploy an xmcp server?",
    answer:
      "xmcp can be deployed to Vercel with zero configuration and also supports platforms including Cloudflare, Replit, and ALPIC. Because xmcp can build to a standard Node.js server, MCP servers using the HTTP transport can also run on other Node.js-compatible hosting providers.",
  },
  {
    slug: "monetization",
    question: "Can I charge for MCP tools built with xmcp?",
    answer:
      "Yes. xmcp supports monetization for MCP tools through Polar and x402. Polar enables license-key-based access, while x402 enables pay-per-call payments using USDC on Base, allowing AI agents to programmatically pay for access to MCP tools.",
  },
  {
    slug: "discoverability",
    question:
      "How do I make my xmcp server discoverable to LLMs and registries?",
    answer:
      "The xmcp docs site exposes /llms.txt (a markdown index) and /llms-full.txt (full documentation) for LLM consumption, and xmcp servers can be published to the Smithery registry for distribution.",
  },
  {
    slug: "open-source",
    question: "Is xmcp open source?",
    answer:
      "Yes. xmcp is an open-source TypeScript framework. Its source code, documentation, examples, issues, and contribution guidelines are available in the xmcp GitHub repository at github.com/basementstudio/xmcp.",
  },
  {
    slug: "what-is-mcp",
    question: "What is the Model Context Protocol (MCP)?",
    answer:
      "The Model Context Protocol (MCP) is an open protocol for connecting AI applications and agents to external tools, data sources, and services. xmcp provides a TypeScript framework for implementing MCP servers without manually handling much of the underlying server infrastructure.",
  },
  {
    slug: "why-xmcp",
    question: "Why use xmcp instead of building an MCP server from scratch?",
    answer:
      "xmcp reduces the boilerplate required to build a TypeScript MCP server. It provides file-system routing, automatic discovery of tools, resources, and prompts, framework adapters, authentication, middleware, deployment support, and monetization integrations in a single framework.",
  },
];
