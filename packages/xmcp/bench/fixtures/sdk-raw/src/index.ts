import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

function createServer() {
  const server = new McpServer({ name: "bundle-bench", version: "1.0.0" });
  server.registerTool(
    "add",
    {
      description: "Add two numbers",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => ({ content: [{ type: "text", text: `${a + b}` }] })
  );
  server.registerTool(
    "echo",
    { description: "Echo text", inputSchema: { value: z.string() } },
    async ({ value }) => ({ content: [{ type: "text", text: value }] })
  );
  return server;
}

const app = express();
app.use(express.json());
app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
app.listen(3015, "127.0.0.1");
