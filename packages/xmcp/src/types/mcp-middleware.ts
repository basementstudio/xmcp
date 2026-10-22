import type {
  HandlerResultTypeMap,
  Icon,
  RequestTypeMap,
} from "@modelcontextprotocol/server";

import type { RequestContext } from "../runtime/contexts/request-context";
import type { ToolAnnotations } from "./tool";

export type McpMiddlewareMethod =
  | "tools/call"
  | "tools/list"
  | "prompts/get"
  | "prompts/list"
  | "resources/read"
  | "resources/list"
  | "resources/templates/list"
  | "completion/complete";

/** Registered tool metadata; _meta uses the same normalized keys as tools/list. */
export interface McpToolMetadata {
  readonly name: string;
  readonly description: string;
  readonly annotations?: Readonly<ToolAnnotations>;
  readonly icons?: readonly Readonly<Icon>[];
  readonly tags?: readonly string[];
  readonly _meta?: Readonly<Record<string, unknown>>;
}

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
  } & (M extends "tools/call"
      ? { readonly tool: { readonly metadata: McpToolMetadata } }
      : {});
}[McpMiddlewareMethod];

export type McpMiddlewareResult = HandlerResultTypeMap[McpMiddlewareMethod];
export type McpMiddlewareNext = () => Promise<McpMiddlewareResult>;

/** Return a result directly to short-circuit, or await next() once. */
export type McpMiddleware = (
  ctx: McpMiddlewareContext,
  next: McpMiddlewareNext
) => McpMiddlewareResult | Promise<McpMiddlewareResult>;
