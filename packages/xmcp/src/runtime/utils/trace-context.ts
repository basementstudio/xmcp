import type { HttpHeaders } from "@/runtime/contexts/http-request-context";
import type { TraceContext } from "@/types/tool";
import { getHeaderValue } from "@/runtime/utils/headers";

const TRACE_HEADER_NAMES = [
  "traceparent",
  "tracestate",
  "baggage",
] as const;

/**
 * Extracts W3C trace-context headers (traceparent/tracestate/baggage) so tools
 * can read and forward them. Returns undefined when none are present.
 */
export const extractTraceContextFromHeaders = (
  headers: HttpHeaders
): TraceContext | undefined => {
  const traceContext: TraceContext = {};
  let found = false;

  for (const headerName of TRACE_HEADER_NAMES) {
    const value = getHeaderValue(headers, headerName);
    if (value !== undefined) {
      traceContext[headerName] = value;
      found = true;
    }
  }

  return found ? traceContext : undefined;
};
