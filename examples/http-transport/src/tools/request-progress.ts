import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";

export const schema = { items: z.array(z.string()) };
export const metadata: ToolMetadata = {
  name: "request-progress",
  description:
    "Normalize a list and report progress using request-local values",
  annotations: { readOnlyHint: true },
};

const completedKey = Symbol("completed");

async function normalizeItem(item: string) {
  const context = getRequestContext();
  context.signal.throwIfAborted();
  const normalized = item.trim().toUpperCase();
  const completed = (context.get<number>(completedKey) ?? 0) + 1;
  context.set(completedKey, completed);
  await context.progress(completed, context.get<number>("total"));
  return normalized;
}

export default async function requestProgress({
  items,
}: InferSchema<typeof schema>) {
  const context = getRequestContext();
  context.set(completedKey, 0);
  context.set("total", items.length);
  await context.progress(0, items.length);
  const normalized = [];
  for (const item of items) normalized.push(await normalizeItem(item));
  await context.log("info", { completed: context.get<number>(completedKey) });
  return {
    structuredContent: {
      items: normalized,
      completed: context.get<number>(completedKey),
    },
  };
}
