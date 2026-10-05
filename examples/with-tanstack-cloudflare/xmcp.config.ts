import type { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: { endpoint: "/mcp" },
  experimental: { adapter: "tanstack" },
  paths: { tools: "./src/tools", prompts: false, resources: false },
  // TanStack generates route types during its build, which runs after xmcp.
  typescript: { skipTypeCheck: true },
};
export default config;
