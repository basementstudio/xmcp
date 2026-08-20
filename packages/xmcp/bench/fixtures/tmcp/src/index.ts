import http from "node:http";
import { Readable } from "node:stream";
import { McpServer } from "tmcp";
import { ZodJsonSchemaAdapter } from "@tmcp/adapter-zod";
import { HttpTransport } from "@tmcp/transport-http";
import { z } from "zod";

const server = new McpServer(
  { name: "bundle-bench", version: "1.0.0" },
  { adapter: new ZodJsonSchemaAdapter(), capabilities: { tools: {} } }
);
server.tool(
  {
    name: "add",
    description: "Add two numbers",
    schema: z.object({ a: z.number(), b: z.number() }),
  },
  async ({ a, b }) => ({ content: [{ type: "text", text: `${a + b}` }] })
);
server.tool(
  {
    name: "echo",
    description: "Echo text",
    schema: z.object({ value: z.string() }),
  },
  async ({ value }) => ({ content: [{ type: "text", text: value }] })
);
const transport = new HttpTransport(server, { path: "/mcp" });
http
  .createServer(async (req, res) => {
    const request = new Request(`http://127.0.0.1:3014${req.url}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : (Readable.toWeb(req) as ReadableStream),
      duplex: "half",
    } as RequestInit);
    const response = await transport.respond(request);
    if (!response) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body as never).pipe(res);
    else res.end();
  })
  .listen(3014, "127.0.0.1");
