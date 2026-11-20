import { withClient } from "xmcp/client";

const [answer = "accept"] = process.argv.slice(2);

const result = await withClient(
  {
    type: "http",
    name: "human-in-the-loop",
    url: process.env.MCP_URL ?? "http://localhost:3001/mcp",
  },
  (client) =>
    client.callTool({
      name: "delete-project",
      arguments: { project: "atlas" },
    }),
  {
    handlers: {
      elicitation: (request) => {
        console.log(`Server asks: ${request.params.message}`);
        return answer === "accept"
          ? { action: "accept", content: { confirmed: true } }
          : { action: "decline" };
      },
    },
  }
);

console.log(result.content[0].text);
