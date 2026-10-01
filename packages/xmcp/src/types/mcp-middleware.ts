import type {
  CallToolResult,
  InputRequiredResult,
} from "@modelcontextprotocol/server";
import type { RequestContext } from "../runtime/contexts/request-context";

/** Context for a validated tools/call invocation. */
export interface McpMiddlewareContext extends RequestContext {
  readonly method: "tools/call";
  readonly params: {
    readonly name: string;
    readonly arguments: Readonly<Record<string, unknown>>;
  };
}

export type McpMiddlewareResult = CallToolResult | InputRequiredResult;
export type McpMiddlewareNext = () => Promise<McpMiddlewareResult>;

/** Return a result directly to short-circuit, or await next() once. */
export type McpMiddleware = (
  ctx: McpMiddlewareContext,
  next: McpMiddlewareNext
) => McpMiddlewareResult | Promise<McpMiddlewareResult>;
