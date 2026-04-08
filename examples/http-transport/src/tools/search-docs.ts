import { z } from "zod";
import { type InferSchema } from "xmcp";

export const schema = {
  query: z.string().describe("Query to look up in the canned docs"),
};

export const metadata = {
  name: "search_docs",
  description: "Returns canned xmcp notes for the sampling helper demo",
};

export default async function searchDocs({
  query,
}: InferSchema<typeof schema>) {
  return `Top hit for "${query}": extra.sample() lets xmcp tool handlers request client-side MCP sampling, optionally expose local tools, and continue the tool_use -> tool_result loop until the model finishes.`;
}
