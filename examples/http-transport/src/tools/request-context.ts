import { getRequestContext, type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "request-context",
  description:
    "Read request details from an async helper without passing tool arguments",
  annotations: { readOnlyHint: true },
};

async function describeRequest() {
  const context = getRequestContext();
  await Promise.resolve();
  context.signal.throwIfAborted();
  return {
    clientInfo: context.clientInfo ?? null,
    httpRequestId: context.http?.id ?? null,
    requestLabel: context.http?.headers["x-request-label"] ?? null,
  };
}

export default async function requestContext() {
  return { structuredContent: await describeRequest() };
}
