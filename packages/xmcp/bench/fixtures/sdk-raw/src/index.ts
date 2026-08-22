import { createServer as createHttpServer } from "node:http";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { z } from "zod";

function createServer() {
  const server = new McpServer({ name: "bundle-bench", version: "1.0.0" });
  server.registerTool(
    "add",
    {
      description: "Add two numbers",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
    },
    async ({ a, b }) => ({ content: [{ type: "text", text: `${a + b}` }] })
  );
  server.registerTool(
    "echo",
    {
      description: "Echo text",
      inputSchema: z.object({ value: z.string() }),
    },
    async ({ value }) => ({ content: [{ type: "text", text: value }] })
  );
  return server;
}

const handler = createMcpHandler(createServer, { legacy: "stateless" });
createHttpServer(toNodeHandler(handler)).listen(3015, "127.0.0.1");
