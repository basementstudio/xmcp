import {
  isInputRequiredResult,
  type ResourceTemplate,
} from "@modelcontextprotocol/server";

import type {
  McpMiddleware,
  McpMiddlewareContext,
} from "../../types/mcp-middleware";

type Status =
  "success" | "failure" | "cancelled" | "input_required" | "unknown";

/** Only trace identifiers are copied; baggage, tracestate and raw headers stay private. */
function traceFields(context: McpMiddlewareContext) {
  const parent = context.http?.headers.traceparent;
  if (typeof parent !== "string") return {};
  const match =
    /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})(-.*)?$/.exec(
      parent
    );
  if (
    !match ||
    match[1] === "ff" ||
    /^0+$/.test(match[2]) ||
    /^0+$/.test(match[3]) ||
    (match[1] === "00" && match[5] !== undefined)
  )
    return {};
  return { trace: { id: match[2] }, parent: { id: match[3] } };
}

/** Internal middleware shared by all transports. No user payloads reach the sink. */
export function createExecutionLogger(
  write: (line: string) => void = (line) => console.error(line)
) {
  const resources = new Map<string, string>();
  const templates: { name: string; template: ResourceTemplate }[] = [];

  function emit(fields: Record<string, unknown>) {
    try {
      write(
        JSON.stringify({ "@timestamp": new Date().toISOString(), ...fields })
      );
    } catch {
      // Observability must never change an operation's result or error.
    }
  }

  function resourceName(uri: string): string {
    try {
      const normalized = new URL(uri).href;
      return (
        resources.get(normalized) ??
        templates.find(({ template }) => template.uriTemplate.match(normalized))
          ?.name ??
        "unknown"
      );
    } catch {
      return "unknown";
    }
  }

  const middleware: McpMiddleware = async (context, next) => {
    if (
      context.method !== "tools/call" &&
      context.method !== "prompts/get" &&
      context.method !== "resources/read"
    )
      return next();

    let fields: Record<string, unknown>;
    let started: number;
    try {
      started = performance.now();
      fields = {
        log: { level: "info" },
        ...traceFields(context),
        // This identifies one execution round, even when an HTTP request is retried.
        transaction: { id: crypto.randomUUID() },
        ...(context.http ? { http: { request: { id: context.http.id } } } : {}),
        xmcp: {
          method: context.method,
          component:
            context.method === "resources/read"
              ? resourceName(context.params.uri)
              : context.params.name,
        },
      };
    } catch {
      return next();
    }
    emit({
      ...fields,
      event: {
        kind: "event",
        category: ["api"],
        type: ["start"],
        action: "execution.start",
      },
    });
    let status: Status = "unknown";
    let error: { message: string } | undefined;
    try {
      const result = await next();
      try {
        status = context.signal.aborted
          ? "cancelled"
          : isInputRequiredResult(result)
            ? "input_required"
            : "isError" in result && result.isError === true
              ? "failure"
              : "success";
        if (status === "failure")
          error = { message: "Operation returned an error result" };
      } catch {
        // Do not evaluate arbitrary result getters again, or serialize the result.
      }
      return result;
    } catch (caught) {
      status = context.signal.aborted ? "cancelled" : "failure";
      // Free-form exception messages can contain inputs, URLs, or credentials.
      error = {
        message:
          status === "cancelled"
            ? "Operation cancelled"
            : "Operation threw an exception",
      };
      throw caught;
    } finally {
      try {
        emit({
          ...fields,
          log: { level: status === "failure" ? "error" : "info" },
          event: {
            kind: "event",
            category: ["api"],
            type: ["end"],
            action: "execution.end",
            duration: Math.round((performance.now() - started) * 1_000_000),
            outcome:
              status === "success"
                ? "success"
                : status === "failure"
                  ? "failure"
                  : "unknown",
          },
          xmcp: { ...(fields.xmcp as object), status },
          ...(error ? { error } : {}),
        });
      } catch {
        // Even timing/serialization failures must leave cancellation and results intact.
      }
    }
  };

  return {
    middleware,
    // Record registered names instead of logging requested URIs, whose path/query
    // can contain secrets. This catalog holds definitions, never client/session state.
    registerResource(name: string, uri: string | ResourceTemplate) {
      try {
        if (typeof uri === "string") resources.set(new URL(uri).href, name);
        else templates.push({ name, template: uri });
      } catch {
        // Registration/validation remains the SDK's responsibility.
      }
    },
  };
}
