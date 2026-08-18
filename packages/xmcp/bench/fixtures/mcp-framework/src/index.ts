import { MCPInput, MCPServer, MCPTool } from "mcp-framework";
import { z } from "zod";

class AddTool extends MCPTool {
  name = "add";
  description = "Add two numbers";
  schema = z.object({ a: z.number(), b: z.number() });
  async execute({ a, b }: MCPInput<this>) {
    return `${a + b}`;
  }
}

class EchoTool extends MCPTool {
  name = "echo";
  description = "Echo text";
  schema = z.object({ value: z.string() });
  async execute({ value }: MCPInput<this>) {
    return value;
  }
}

const server = new MCPServer({
  name: "bundle-bench",
  version: "1.0.0",
  transport: { type: "http-stream", options: { port: 3013 } },
});
server.addTool(AddTool);
server.addTool(EchoTool);
await server.start();
