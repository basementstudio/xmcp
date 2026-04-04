import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  query: z.string().describe("Query to look up in the canned docs"),
};

export const metadata: ToolMetadata = {
  name: "search_docs",
  description: "Returns canned xmcp notes for the sampling helper demo",
  annotations: {
    title: "Search docs",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function searchDocs({
  query,
}: InferSchema<typeof schema>) {
  return {
    content: [
      {
        type: "text",
        text: `Top hit for "${query}": extra.sample() lets xmcp tool handlers request client-side MCP sampling, optionally expose local tools, and continue the tool_use -> tool_result loop until the model finishes.`,
      },
    ],
  };
}
