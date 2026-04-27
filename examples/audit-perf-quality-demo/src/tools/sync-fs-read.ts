import { readFileSync } from "node:fs";
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  filename: z.string().max(64).describe("File under ./data to read"),
};

export const metadata: ToolMetadata = {
  name: "sync_fs_read",
  description: "Read a small file from disk and return its contents.",
};

export default async function syncFsRead({
  filename,
}: InferSchema<typeof schema>) {
  return readFileSync(`./data/${filename}`, "utf8");
}
