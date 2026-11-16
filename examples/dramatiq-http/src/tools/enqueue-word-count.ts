import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { bridge } from "../bridge";

export const schema = { text: z.string().min(1).max(10000) };

export const metadata: ToolMetadata = {
  name: "enqueue-word-count",
  description:
    "Enqueue a background word count job and return its job ID. Not retried.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export default async function enqueueWordCount(
  input: InferSchema<typeof schema>
) {
  const job = await bridge().enqueue(
    { actor: "count_words", args: [input.text] },
    { signal: getRequestContext().signal }
  );
  return JSON.stringify(job);
}
