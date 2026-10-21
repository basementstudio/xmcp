import type {
  McpServer,
  RequestTypeMap,
  ServerContext,
} from "@modelcontextprotocol/server";

import type {
  McpMiddleware,
  McpMiddlewareContext,
  McpMiddlewareResult,
  McpToolMetadata,
} from "@/types/mcp-middleware";

import {
  getRequestContext,
  withRequestContext,
} from "../contexts/request-context";
import {
  type McpToolHandler,
  resolveToolClientInfo,
} from "./transformers/tool";

export function normalizeMcpMiddleware(value: unknown): McpMiddleware[] {
  if (value === undefined) return [];
  const handlers = Array.isArray(value) ? [...value] : [value];
  if (!handlers.every((handler) => typeof handler === "function")) {
    throw new Error(
      "src/middleware.ts must export mcp as a function or an array of functions"
    );
  }
  return handlers;
}

/** Share one dispatch implementation and one request scope for every operation. */
function createMiddlewareRunner(middleware: readonly McpMiddleware[]) {
  const chain = [...middleware];
  return (
    operation: Pick<McpMiddlewareContext, "method" | "params"> & {
      readonly tool?: { readonly metadata: McpToolMetadata };
    },
    ctx: ServerContext,
    handler: () => McpMiddlewareResult | Promise<McpMiddlewareResult>
  ) =>
    withRequestContext(ctx, resolveToolClientInfo(ctx), async () => {
      if (chain.length === 0) return handler();
      const context: McpMiddlewareContext = Object.freeze({
        ...getRequestContext(),
        ...operation,
        params: Object.freeze({ ...operation.params }),
      }) as McpMiddlewareContext;
      let lastIndex = -1;
      const dispatch = async (index: number): Promise<McpMiddlewareResult> => {
        if (index <= lastIndex) {
          throw new Error("MCP middleware next() can only be called once");
        }
        lastIndex = index;
        const current = chain[index];
        return current
          ? current(context, () => dispatch(index + 1))
          : handler();
      };
      return dispatch(0);
    });
}

/** Copy JSON-like metadata so freezing the view never freezes registration inputs. */
function snapshotMetadata<T>(
  value: T,
  seen = new WeakMap<object, unknown>()
): T {
  if (value === null || typeof value !== "object") return value;
  const prototype = Object.getPrototypeOf(value);
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    return value;
  }
  if (seen.has(value)) return seen.get(value) as T;
  const copy = Array.isArray(value) ? [] : Object.create(prototype);
  seen.set(value, copy);
  for (const [key, item] of Object.entries(value)) {
    Object.defineProperty(copy, key, {
      value: snapshotMetadata(item, seen),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return Object.freeze(copy) as T;
}

/** Tool middleware stays inside SDK input/output validation and tool-error handling. */
export function wrapToolWithMiddleware(
  handler: McpToolHandler,
  metadata: McpToolMetadata,
  middleware: readonly McpMiddleware[]
): McpToolHandler {
  const run = createMiddlewareRunner(middleware);
  const tool = Object.freeze({ metadata: snapshotMetadata(metadata) });
  return (args, ctx) =>
    run(
      {
        method: "tools/call",
        params: { name: tool.metadata.name, arguments: args },
        tool,
      },
      ctx,
      () => handler(args, ctx)
    ) as ReturnType<McpToolHandler>;
}

const requestMethods = new Set([
  "tools/list",
  "prompts/get",
  "prompts/list",
  "resources/read",
  "resources/list",
  "resources/templates/list",
  "completion/complete",
] as const);
type RequestMethod = typeof requestMethods extends Set<infer M> ? M : never;
type RequestHandler = (
  request: RequestTypeMap[RequestMethod],
  ctx: ServerContext
) => McpMiddlewareResult | Promise<McpMiddlewareResult>;

/**
 * McpServer installs listing/completion handlers lazily during registration and
 * has no public handler getter. Decorate that public registration seam only
 * while registering components, then restore it even if registration fails.
 * This retains SDK catalog/URI/completion behavior and runs the chain once,
 * including ResourceTemplate list/read/complete callbacks and generated UI resources.
 */
export function registerWithMcpMiddleware(
  server: McpServer,
  middleware: readonly McpMiddleware[],
  register: () => void
): void {
  const protocol = server.server;
  const original = protocol.setRequestHandler;
  const run = createMiddlewareRunner(middleware);
  protocol.setRequestHandler = ((
    method: string,
    ...registration: unknown[]
  ) => {
    if (
      requestMethods.has(method as RequestMethod) &&
      registration.length === 1 &&
      typeof registration[0] === "function"
    ) {
      const handler = registration[0] as RequestHandler;
      registration[0] = (
        request: RequestTypeMap[RequestMethod],
        ctx: ServerContext
      ) =>
        run({ method: request.method, params: request.params ?? {} }, ctx, () =>
          handler(request, ctx)
        );
    }
    Reflect.apply(original, protocol, [method, ...registration]);
  }) as typeof original;
  try {
    register();
  } finally {
    protocol.setRequestHandler = original;
  }
}
