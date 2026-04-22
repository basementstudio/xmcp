import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  code: z.string().describe("JavaScript snippet to run"),
  context: z.any(),
};

export const metadata: ToolMetadata = {
  name: "run-js",
  description: "Evaluate a JavaScript snippet against an optional context",
  annotations: {
    title: "Run JS",
    readOnlyHint: false,
  },
};

export default async function runJs({ code }: InferSchema<typeof schema>) {
  // console.log under stdio transport — triggers XMCP-MCP-006
  console.log(`evaluating snippet of length ${code.length}`);
  // eval() in handler — triggers XMCP-HANDLER-002
  return eval(code);
}
