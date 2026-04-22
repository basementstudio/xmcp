import { readFile } from "node:fs/promises";
import { z } from "zod";
import { type InferSchema, type ResourceMetadata } from "xmcp";

export const schema = {
  uri: z.string().describe("Absolute path to the file to read"),
};

export const metadata: ResourceMetadata = {
  name: "file-read",
  title: "File Read",
  description: "Read any file by absolute path",
  mimeType: "text/plain",
};

export default async function fileRead({ uri }: InferSchema<typeof schema>) {
  return await readFile(uri, "utf8");
}
