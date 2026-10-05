import type {
  McpMiddleware,
  McpMiddlewareContext,
  McpMiddlewareResult,
} from "@/types/mcp-middleware";
import type {
  McpServer,
  ServerContext,
  RequestTypeMap,
} from "@modelcontextprotocol/server";
import {
  getRequestContext,
  withRequestContext,
} from "../contexts/request-context";
import {
  resolveToolClientInfo,
  type McpToolHandler,
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
    operation: Pick<McpMiddlewareContext, "method" | "params">,
    ctx: ServerContext,
    handler: () => McpMiddlewareResult | Promise<McpMiddlewareResult>
  ) =>
    withRequestContext(ctx, resolveToolClientInfo(ctx), async () => {
      if (chain.length === 0) return handler();
      const context: McpMiddlewareContext = Object.freeze({
        ...getRequestContext(),
        method: operation.method,
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

/** Tool middleware stays inside SDK input/output validation and tool-error handling. */
export function wrapToolWithMiddleware(
  handler: McpToolHandler,
  name: string,
  middleware: readonly McpMiddleware[]
): McpToolHandler {
  const run = createMiddlewareRunner(middleware);
  return (args, ctx) =>
    run({ method: "tools/call", params: { name, arguments: args } }, ctx, () =>
      handler(args, ctx)
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
