import type {
  McpMiddleware,
  McpMiddlewareContext,
  McpMiddlewareResult,
} from "@/types/mcp-middleware";
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

/** Installed once at registration, after SDK input validation and before execution. */
export function wrapToolWithMiddleware(
  handler: McpToolHandler,
  name: string,
  middleware: readonly McpMiddleware[]
): McpToolHandler {
  const chain = [...middleware];
  return (args, ctx) =>
    // One scope covers middleware before/after next() and the tool itself.
    withRequestContext(ctx, resolveToolClientInfo(ctx), async () => {
      if (chain.length === 0) return handler(args, ctx);
      const context: McpMiddlewareContext = Object.freeze({
        ...getRequestContext(),
        method: "tools/call" as const,
        params: Object.freeze({ name, arguments: args }),
      });
      let lastIndex = -1;
      const dispatch = async (index: number): Promise<McpMiddlewareResult> => {
        if (index <= lastIndex) {
          throw new Error("MCP middleware next() can only be called once");
        }
        lastIndex = index;
        const current = chain[index];
        return current
          ? current(context, () => dispatch(index + 1))
          : handler(args, ctx);
      };
      return dispatch(0);
    });
}
