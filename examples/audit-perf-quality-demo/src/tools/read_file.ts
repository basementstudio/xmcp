import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  path: z.string().max(256).describe("Path to read"),
};

export const metadata: ToolMetadata = {
  name: "read_file",
  description: "Read a file from the project workspace.",
};

export default async function readFile({ path }: InferSchema<typeof schema>) {
  return `would read ${path}`;
}
