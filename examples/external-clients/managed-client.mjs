import { withClient } from "xmcp/client";

const tools = await withClient(
  {
    type: "http",
    name: "local",
    url: process.env.MCP_URL ?? "http://localhost:3001/mcp",
  },
  async (client) => (await client.listTools()).tools
);

console.log(JSON.stringify(tools, null, 2));
