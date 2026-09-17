export const REQUEST_CONTEXT_FILES = {
  "src/tools/request-context.ts": `import { getRequestContext, type ToolExtraArguments } from "xmcp";
export const metadata = { name: "request-context", description: "Echo the current request context" };
async function readContext() {
  const before = getRequestContext();
  await Promise.resolve();
  const context = getRequestContext();
  return { context, sameContext: before === context };
}
export default async function requestContext(_args: unknown, extra: ToolExtraArguments) {
  const { context, sameContext } = await readContext();
  return { structuredContent: {
    clientInfo: context.clientInfo ?? null,
    http: context.http ?? null,
    aborted: context.signal.aborted,
    sameSignal: context.signal === extra.signal,
    sameContext,
    frozen: Object.isFrozen(context) && (!context.http || Object.isFrozen(context.http.headers)),
  } };
}
`,
};
