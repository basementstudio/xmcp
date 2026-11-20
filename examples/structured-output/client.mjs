import { withClient } from "xmcp/client";

const forecast = await withClient(
  {
    type: "http",
    name: "weather",
    url: process.env.MCP_URL ?? "http://localhost:3001/mcp",
  },
  async (client) => {
    const result = await client.callTool({
      name: "list-forecast",
      arguments: { days: 2 },
    });
    return result.structuredContent;
  }
);

for (const { day, high, low } of forecast) {
  console.log(`${day}: ${low} to ${high} °C`);
}
