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

/** Registered prompt or resource metadata, using the same _meta keys as listings. */
export interface McpComponentMetadata {
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly icons?: readonly Readonly<Icon>[];
  readonly tags?: readonly string[];
  readonly mimeType?: string;
  readonly _meta?: Readonly<Record<string, unknown>>;
}

/** The registered component an operation targets. */
export type McpAuthorizeComponent =
  | {
      readonly type: "tool";
      readonly name: string;
      readonly metadata: McpToolMetadata;
    }
  | {
      readonly type: "prompt";
      readonly name: string;
      readonly metadata: McpComponentMetadata;
    }
  | {
      readonly type: "resource";
      readonly name: string;
      readonly uri: string;
      readonly metadata: McpComponentMetadata;
    }
  | {
      readonly type: "resourceTemplate";
      readonly name: string;
      readonly uriTemplate: string;
      readonly metadata: McpComponentMetadata;
    };

/**
 * `list` covers every catalog; `call` is tools/call, `get` is prompts/get,
 * `read` is resources/read, and `complete` is completion/complete.
 */
export type McpAuthorizeOperation =
  | "list"
  | "call"
  | "get"
  | "read"
  | "complete";

/**
 * Optional `authorize` export from src/middleware.ts. Return false to hide a
 * component from listings and reject direct access as if it did not exist.
 */
export type McpAuthorize = (
  ctx: McpMiddlewareContext,
  component: McpAuthorizeComponent,
  operation: McpAuthorizeOperation
) => boolean | Promise<boolean>;
