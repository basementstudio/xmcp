import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  query: z.string().describe("The search query"),
};

export const metadata: ToolMetadata = {
  name: "search",
  description: "Search public documentation — free for all users",
  annotations: {
    title: "Search docs",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function search({ query }: InferSchema<typeof schema>) {
  return `Results for "${query}": [doc1, doc2, doc3]`;
}
