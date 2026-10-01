export const MCP_MIDDLEWARE_FILES = {
  "src/middleware.ts": `import { getRequestContext, type McpMiddleware } from "xmcp";
const outer: McpMiddleware = async (ctx, next) => {
  if (!ctx.params.name.startsWith("middleware-")) return next();
  if (ctx.params.name === "middleware-denied") throw new Error("Denied by MCP middleware");
  if (ctx.params.name === "middleware-short-circuit") return { content: [{ type: "text", text: "short-circuited" }] };
  if (ctx.method !== "tools/call") throw new Error("Wrong method");
  ctx.set("trace", ["outer before"]);
  ctx.set("label", ctx.params.arguments.label);
  const result = await next();
  const trace = getRequestContext().get<string[]>("trace")!;
  trace.push("outer after");
  return { ...result, _meta: { ...result._meta, trace, label: ctx.get("label") } };
};
const inner: McpMiddleware = async (ctx, next) => {
  if (!ctx.params.name.startsWith("middleware-")) return next();
  const trace = ctx.get<string[]>("trace")!;
  trace.push("inner before");
  const result = await next();
  trace.push("inner after");
  return result;
};
export const mcp = [outer, inner];
`,
  "src/tools/middleware-echo.ts": `import { getRequestContext } from "xmcp";
import { z } from "zod";
export const schema = { label: z.string() };
export default async function middlewareEcho() {
  await Promise.resolve();
  const ctx = getRequestContext();
  ctx.get<string[]>("trace")!.push("tool");
  return { structuredContent: { label: ctx.get("label") } };
}
`,
  "src/tools/middleware-denied.ts": `export default function denied() { throw new Error("Denied handler must not run"); }\n`,
  "src/tools/middleware-short-circuit.ts": `export default function shortCircuit() { throw new Error("Short-circuit handler must not run"); }\n`,
};
