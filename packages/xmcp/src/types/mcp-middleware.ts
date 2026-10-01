import type {
  HandlerResultTypeMap,
  RequestTypeMap,
} from "@modelcontextprotocol/server";
import type { RequestContext } from "../runtime/contexts/request-context";

export type McpMiddlewareMethod =
  | "tools/call"
  | "tools/list"
  | "prompts/get"
  | "prompts/list"
  | "resources/read"
  | "resources/list"
  | "resources/templates/list"
  | "completion/complete";

/** Narrow by method before accessing operation-specific parameters. */
export type McpMiddlewareContext = {
  [M in McpMiddlewareMethod]: RequestContext & {
    readonly method: M;
    readonly params: M extends "tools/call"
      ? {
          readonly name: string;
          readonly arguments: Readonly<Record<string, unknown>>;
        }
      : Readonly<NonNullable<RequestTypeMap[M]["params"]>>;
  };
}[McpMiddlewareMethod];

export type McpMiddlewareResult = HandlerResultTypeMap[McpMiddlewareMethod];
export type McpMiddlewareNext = () => Promise<McpMiddlewareResult>;

/** Return a result directly to short-circuit, or await next() once. */
export type McpMiddleware = (
  ctx: McpMiddlewareContext,
  next: McpMiddlewareNext
) => McpMiddlewareResult | Promise<McpMiddlewareResult>;
