import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  count: z.number().min(1).max(1000).describe("Number of rows to return"),
};

export const metadata: ToolMetadata = {
  name: "json_blob",
  description: "Return a generated dataset as JSON text content.",
};

export default async function jsonBlob({ count }: InferSchema<typeof schema>) {
  const rows = Array.from({ length: count }, (_, i) => ({
    id: i,
    value: i * 2,
  }));
  return {
    content: [{ type: "text" as const, text: JSON.stringify(rows) }],
  };
}
