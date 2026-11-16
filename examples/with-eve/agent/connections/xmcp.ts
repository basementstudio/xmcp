import { defineMcpClientConnection } from "eve/connections";
import { required } from "../../src/env";

// Only the read-only policy tool is allowed, so the agent cannot discover
// `ask-agent` and call itself recursively.
export default defineMcpClientConnection({
  url: process.env.MCP_URL || "http://localhost:3001/mcp",
  description: "Read the demonstration store shipping policy.",
  auth: { getToken: async () => ({ token: required("MCP_API_KEY") }) },
  tools: { allow: ["get-shipping-policy"] },
});
