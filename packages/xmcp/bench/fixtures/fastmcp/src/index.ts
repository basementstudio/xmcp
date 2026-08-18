import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({ name: "bundle-bench", version: "1.0.0" });
server.addTool({
  name: "add",
  description: "Add two numbers",
  parameters: z.object({ a: z.number(), b: z.number() }),
  execute: async ({ a, b }) => `${a + b}`,
});
server.addTool({
  name: "echo",
  description: "Echo text",
  parameters: z.object({ value: z.string() }),
  execute: async ({ value }) => value,
});
await server.start({ transportType: "httpStream", httpStream: { port: 3012 } });
