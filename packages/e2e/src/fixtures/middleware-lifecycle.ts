import { REQUEST_TIMEOUT_MS } from "../harness/constants.js";

export const MIDDLEWARE_LIFECYCLE_FILES = {
  "src/lifecycle-probe.ts": `// The test owns this callback server; it observes a request after its MCP stream closes.
const PROBE_TIMEOUT_MS = ${REQUEST_TIMEOUT_MS};
export async function report(probeUrl: string, phase: string, data: Record<string, unknown>) {
  const response = await fetch(probeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phase, ...data }),
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });
  await response.text();
  if (!response.ok) throw new Error("Cancellation probe rejected observation");
}
`,
  "src/lifecycle-middleware.ts": `import { getRequestContext, type McpMiddleware } from "xmcp";
import { report } from "./lifecycle-probe";
const outer: McpMiddleware = async (ctx, next) => {
  if (ctx.method !== "tools/call" || !ctx.params.name.startsWith("lifecycle-")) return next();
  if (ctx.get("lifecycle.completed") !== undefined) throw new Error("Previous round leaked request-local values");
  ctx.set("lifecycle.trace", ["outer before"]);
  ctx.set("lifecycle.signal", ctx.signal);
  try {
    const result = await next();
    const trace = ctx.get<string[]>("lifecycle.trace")!;
    trace.push("outer after");
    if (result.resultType === "input_required") {
      if (result !== ctx.get("lifecycle.interim")) throw new Error("Interim result changed in middleware");
      return result;
    }
    return { ...result, _meta: { ...result._meta, lifecycleTrace: trace } };
  } finally {
    if (ctx.params.name === "lifecycle-cancel") {
      await report(String(ctx.params.arguments.probeUrl), "middleware-finished", {
        aborted: ctx.signal.aborted,
        sameSignal: ctx.signal === getRequestContext().signal,
      });
    }
  }
};
const inner: McpMiddleware = async (ctx, next) => {
  if (ctx.method !== "tools/call" || !ctx.params.name.startsWith("lifecycle-")) return next();
  const trace = ctx.get<string[]>("lifecycle.trace")!;
  trace.push("inner before");
  const result = await next();
  trace.push("inner after");
  return result;
};
export const lifecycle = [outer, inner];
`,
  "src/tools/lifecycle-confirm.ts": `import { acceptedContent, getRequestContext, inputRequired, type ToolExtraArguments } from "xmcp";
export default function confirm(_args: unknown, extra: ToolExtraArguments) {
  const ctx = getRequestContext();
  const trace = ctx.get<string[]>("lifecycle.trace")!;
  if (JSON.stringify(trace) !== JSON.stringify(["outer before", "inner before"])) throw new Error("Middleware did not enter a fresh round");
  if (ctx.signal !== extra.signal || ctx.signal !== ctx.get("lifecycle.signal")) throw new Error("Signal was replaced");
  ctx.set("lifecycle.completed", true);
  const state = extra.requestState<string>();
  trace.push("tool:" + (state ?? "initial"));
  if (state !== undefined) {
    const answer = acceptedContent<{ confirmed: boolean }>(extra.inputResponses, "confirmation");
    if (answer?.confirmed !== true) throw new Error("Missing elicitation response");
  }
  if (state === "lifecycle:finished") return { structuredContent: { confirmed: true, state } };
  if (state !== undefined && state !== "lifecycle:second") throw new Error("Opaque state was changed");
  const interim = inputRequired({
    requestState: state === undefined ? "lifecycle:second" : "lifecycle:finished",
    inputRequests: { confirmation: inputRequired.elicit({
      message: state === undefined ? "First confirmation?" : "Second confirmation?",
      requestedSchema: { type: "object", properties: { confirmed: { type: "boolean" } }, required: ["confirmed"] },
    }) },
  });
  ctx.set("lifecycle.interim", interim);
  return interim;
}
`,
  "src/tools/lifecycle-cancel.ts": `import { getRequestContext, type ToolExtraArguments } from "xmcp";
import { z } from "zod";
import { report } from "../lifecycle-probe";
export const schema = { probeUrl: z.string().url() };
export default async function cancel({ probeUrl }: { probeUrl: string }, extra: ToolExtraArguments) {
  const ctx = getRequestContext();
  const sameSignal = ctx.signal === extra.signal && ctx.signal === ctx.get("lifecycle.signal");
  const aborted = new Promise<void>((resolve) => {
    if (extra.signal.aborted) resolve();
    else extra.signal.addEventListener("abort", () => resolve(), { once: true });
  });
  await report(probeUrl, "started", { sameSignal, aborted: extra.signal.aborted });
  await aborted;
  await report(probeUrl, "handler-aborted", { sameSignal, aborted: extra.signal.aborted, contextAborted: ctx.signal.aborted });
  extra.signal.throwIfAborted();
  return "unreachable";
}
`,
};
