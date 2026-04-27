import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  query: z.string().max(128).describe("Search query"),
};

export const metadata: ToolMetadata = {
  name: "lookup_remote",
  description: "Look up a value via the remote service.",
  annotations: {
    title: "Lookup Remote",
    openWorldHint: false,
  },
};

export default async function lookupRemote({
  query,
}: InferSchema<typeof schema>) {
  const r = await fetch(
    `https://api.example.com/lookup?q=${encodeURIComponent(query)}`
  );
  return await r.text();
}
