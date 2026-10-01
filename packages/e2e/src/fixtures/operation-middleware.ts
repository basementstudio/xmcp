export const OPERATION_MIDDLEWARE_FILES = {
  "src/operation-middleware.ts": `import { type McpMiddleware } from "xmcp";
export const operations: McpMiddleware = async (ctx, next) => {
  switch (ctx.method) {
    case "tools/list": {
      const result = await next();
      return { ...result, tools: (result.tools as { name: string }[]).filter((item) => item.name !== "middleware-denied") };
    }
    case "prompts/list": {
      const result = await next();
      return { ...result, prompts: (result.prompts as { name: string }[]).filter((item) => item.name !== "operation-denied") };
    }
    case "resources/list": {
      const result = await next();
      return { ...result, resources: (result.resources as { uri: string }[]).filter((item) => item.uri !== "operation://denied") };
    }
    case "resources/templates/list": {
      const result = await next();
      return { ...result, resourceTemplates: (result.resourceTemplates as { name: string }[]).filter((item) => item.name !== "operation-denied-template") };
    }
    case "resources/read":
      if (new URL(ctx.params.uri).href.startsWith("operation://denied")) throw new Error("Read denied by middleware");
      ctx.set("operation.value", ctx.params.uri);
      break;
    case "prompts/get":
      if (ctx.params.name === "operation-denied") throw new Error("Prompt denied by middleware");
      ctx.set("operation.value", ctx.params.arguments?.value);
      break;
    case "completion/complete":
      if (ctx.params.ref.type === "ref/prompt" && ctx.params.ref.name === "operation-denied") return { completion: { values: [] } };
      ctx.set("operation.value", "from middleware");
      break;
    default: return next();
  }
  const result = await next();
  return { ...result, _meta: { ...result._meta, operation: ctx.method, seen: ctx.get("operation.seen") } };
};
`,
  "src/prompts/operation-echo.ts": `import { getRequestContext, completable } from "xmcp";
import { z } from "zod";
export const schema = { value: completable(z.string(), async (value) => {
  const ctx = getRequestContext();
  ctx.set("operation.seen", ctx.get("operation.value"));
  return [value + ":" + ctx.get("operation.value")];
}) };
export default async function echo() {
  await Promise.resolve();
  const ctx = getRequestContext();
  ctx.set("operation.seen", ctx.get("operation.value"));
  return String(ctx.get("operation.value"));
}
`,
  "src/prompts/operation-denied.ts": `import { completable } from "xmcp";
import { z } from "zod";
export const schema = { value: completable(z.string(), () => { throw new Error("Denied completion ran"); }) };
export default function denied() { throw new Error("Denied prompt ran"); }
`,
  "src/resources/(operation)/echo.ts": `import { getRequestContext } from "xmcp";
export default function echo() {
  const ctx = getRequestContext();
  ctx.set("operation.seen", ctx.get("operation.value"));
  return String(ctx.get("operation.value"));
}
`,
  "src/resources/(operation)/echo/[value]/index.ts": `import { getRequestContext } from "xmcp";
export default async function echo() {
  await Promise.resolve();
  const ctx = getRequestContext();
  ctx.set("operation.seen", ctx.get("operation.value"));
  return String(ctx.get("operation.value"));
}
`,
  "src/resources/(operation)/denied.ts": `export default function denied() { throw new Error("Denied resource ran"); }\n`,
  "src/resources/(operation)/denied/[value]/index.ts": `export const metadata = { name: "operation-denied-template" };
export default function denied() { throw new Error("Denied template ran"); }
`,
};
