import { getRequestContext, type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "trace-context",
  description:
    "Return the W3C trace context headers to forward to downstream services",
  annotations: { readOnlyHint: true },
};

function downstreamTraceHeaders() {
  const { _meta, http } = getRequestContext();
  const traceparent = _meta?.traceparent ?? http?.headers.traceparent;
  return typeof traceparent === "string" ? { traceparent } : {};
}

export default function traceContext() {
  return { structuredContent: { headers: downstreamTraceHeaders() } };
}
