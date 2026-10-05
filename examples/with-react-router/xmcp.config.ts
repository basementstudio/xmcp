import type { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: { endpoint: "/mcp" },
  experimental: { adapter: "react-router" },
  paths: { tools: "./src/tools", prompts: false, resources: false },
  // The host build checks application types after the adapter exists.
  typescript: { skipTypeCheck: true },
};
export default config;
