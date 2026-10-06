import type * as Sentry from "@sentry/node";
import type { McpMiddleware, McpMiddlewareResult } from "xmcp";

export interface SentryMiddlewareOptions {
  /** Pass the same initialized SDK namespace used by the application. */
  sentry: Pick<
    typeof Sentry,
    "withIsolationScope" | "startSpan" | "captureException" | "captureMessage"
  >;
}

function safely(action: () => void): void {
  try {
    action();
  } catch {
    /* Telemetry must not replace an operation result. */
  }
}

/** Trace execution without attaching tool inputs, outputs, headers or resource URIs. */
export function sentryMiddleware({
  sentry,
}: SentryMiddlewareOptions): McpMiddleware {
  return async (context, next) => {
    if (
      context.method !== "tools/call" &&
      context.method !== "prompts/get" &&
      context.method !== "resources/read"
    )
      return next();
    const component =
      context.method === "resources/read" ? undefined : context.params.name;
    let execution: Promise<McpMiddlewareResult> | undefined;
    const execute = (span?: Sentry.Span) =>
      (execution ??= (async () => {
        try {
          const result = await next();
          let outcome = "unknown";
          safely(() => {
            outcome = context.signal.aborted
              ? "cancelled"
              : result.resultType === "input_required"
                ? "input_required"
                : result.isError === true
                  ? "error"
                  : "success";
          });
          safely(() => {
            span?.setAttribute("xmcp.outcome", outcome);
            span?.setStatus(
              outcome === "error"
                ? { code: 2, message: "tool_error" }
                : outcome === "cancelled"
                  ? { code: 2, message: "cancelled" }
                  : outcome === "input_required"
                    ? { code: 0 }
                    : { code: 1 }
            );
          });
          if (outcome === "error")
            safely(() => {
              sentry.captureMessage("MCP tool returned an error", "error");
            });
          return result;
        } catch (error) {
          safely(() => {
            span?.setAttribute(
              "xmcp.outcome",
              context.signal.aborted ? "cancelled" : "error"
            );
            span?.setStatus({
              code: 2,
              message: context.signal.aborted ? "cancelled" : "internal_error",
            });
          });
          if (!context.signal.aborted)
            safely(() => {
              sentry.captureException(error);
            });
          throw error;
        }
      })());
    try {
      return await sentry.withIsolationScope((scope) => {
        scope.setTag("mcp.method", context.method);
        if (component) scope.setTag("mcp.component", component);
        return sentry.startSpan(
          {
            name: component ? `${context.method} ${component}` : context.method,
            op: "mcp.server",
            attributes: {
              "mcp.method.name": context.method,
              "network.transport": context.http ? "http" : "stdio",
            },
          },
          (span) => execute(span)
        );
      });
    } catch {
      // The SDK can fail before or after invoking its callback. Reuse the
      // original promise so telemetry failures can never run the tool twice.
      return execution ?? execute();
    }
  };
}
