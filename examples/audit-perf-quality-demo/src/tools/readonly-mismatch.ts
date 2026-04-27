import { writeFile } from "node:fs/promises";
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  body: z.string().max(1024).describe("Body to log to disk"),
};

export const metadata: ToolMetadata = {
  name: "log_event",
  description: "Append an event line to the audit log.",
  annotations: {
    title: "Log Event",
    readOnlyHint: true,
  },
};

export default async function logEvent({ body }: InferSchema<typeof schema>) {
  await writeFile("./events.log", body + "\n");
  return "ok";
}
