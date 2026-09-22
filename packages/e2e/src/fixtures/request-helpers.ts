export const REQUEST_HELPERS_FILES = {
  "src/tools/request-helpers.ts": `import { getRequestContext } from "xmcp";
import { z } from "zod";
export const schema = { label: z.string() };
export const metadata = { name: "request-helpers", description: "Exercise local values and request notifications" };
async function readLabel() {
  await Promise.resolve();
  return getRequestContext().get<string>("label");
}
export default async function requestHelpers({ label }: { label: string }) {
  const context = getRequestContext();
  const previous = context.get("label") ?? null;
  context.set("label", label);
  await context.progress(0, 2);
  const storedLabel = await readLabel();
  await context.progress(1, 2);
  await context.log("info", { label: storedLabel });
  await context.progress(2, 2);
  return { structuredContent: { previous, label: storedLabel } };
}
`,
};
