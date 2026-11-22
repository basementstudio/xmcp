import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  template: {
    name: "xmcp docs",
    description:
      "Search and read the xmcp documentation for building MCP servers in TypeScript.",
    instructions:
      "Call search with a question to find pages, list-pages to browse every page, and get-page with an id to read one page as markdown.",
  },
  experimental: {
    adapter: "nextjs",
  },
  paths: {
    tools: "tools",
    prompts: false,
    resources: false,
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
