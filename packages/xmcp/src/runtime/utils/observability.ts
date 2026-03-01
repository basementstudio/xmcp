import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import {
  CallToolResult,
  GetPromptResult,
  ReadResourceResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";

export type ExecutionType = "tool" | "prompt" | "resource";

type LogLevel = "info" | "error";

type ExecutionLogCommon = {
  source: "xmcp";
  category: "execution";
  phase: "start" | "end";
  type: ExecutionType;
  name: string;
  timestamp: string;
  requestId?: string | number;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  "@timestamp": string;
  "ecs.version": "8.11.0";
  "event.kind": "event";
  "event.category": ["application"];
  "event.action": string;
  "log.level": LogLevel;
  "request.id"?: string | number;
  "session.id"?: string;
  "trace.id"?: string;
  "span.id"?: string;
};

type ExecutionStartLog = ExecutionLogCommon & {
  phase: "start";
  input: unknown;
};

type ExecutionEndLog = ExecutionLogCommon & {
  phase: "end";
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  outputSummary?: unknown;
  "event.duration": number;
  "event.outcome": "success" | "failure";
  "error.message"?: string;
};

declare const OBSERVABILITY: boolean | undefined;

function isObservabilityEnabled(): boolean {
  if (typeof OBSERVABILITY !== "undefined") {
    return Boolean(OBSERVABILITY);
  }

  // Test fallback when runtime injection is not available.
  return process.env.XMCP_OBSERVABILITY_TEST === "true";
}

const SENSITIVE_KEY_PATTERN =
  /authorization|token|access[_-]?token|refresh[_-]?token|password|secret|api[_-]?key|apikey|cookie|set-cookie/i;

const MAX_STRING_LENGTH = 2000;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 100;

function truncate(value: string, maxLen: number = 200): string {
  if (value.length <= maxLen) {
    return value;
  }
  return `${value.slice(0, maxLen)}...`;
}

function sanitizeValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}...`
      : value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    const limited = value.slice(0, MAX_ARRAY_ITEMS);
    const mapped = limited.map((item) => sanitizeValue(item, seen));
    if (value.length > MAX_ARRAY_ITEMS) {
      mapped.push(`[TRUNCATED:${value.length - MAX_ARRAY_ITEMS} items]`);
    }
    return mapped;
  }

  if (typeof value === "object") {
    if (seen.has(value as object)) {
      return "[CIRCULAR]";
    }
    seen.add(value as object);

    const entries = Object.entries(value as Record<string, unknown>);
    const limitedEntries = entries.slice(0, MAX_OBJECT_KEYS);
    const result: Record<string, unknown> = {};

    for (const [key, child] of limitedEntries) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeValue(child, seen);
      }
    }

    if (entries.length > MAX_OBJECT_KEYS) {
      result.__truncatedKeys = entries.length - MAX_OBJECT_KEYS;
    }

    return result;
  }

  return String(value);
}

function redact(value: unknown): unknown {
  return sanitizeValue(value, new WeakSet<object>());
}

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const direct = headers[key] ?? headers[key.toLowerCase()];

  if (Array.isArray(direct)) {
    return direct[0];
  }

  if (typeof direct === "string") {
    return direct;
  }

  const match = Object.entries(headers).find(
    ([headerKey]) => headerKey.toLowerCase() === key.toLowerCase()
  );

  if (!match) {
    return undefined;
  }

  const value = match[1];
  return Array.isArray(value) ? value[0] : value;
}

function parseTraceparent(traceparent: string):
  | {
      traceId: string;
      spanId: string;
    }
  | undefined {
  const match = traceparent
    .trim()
    .match(/^[0-9a-f]{2}-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/i);

  if (!match) {
    return undefined;
  }

  return {
    traceId: match[1].toLowerCase(),
    spanId: match[2].toLowerCase(),
  };
}

function getContext(
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>
): Pick<
  ExecutionLogCommon,
  "requestId" | "sessionId" | "traceId" | "spanId" | "request.id" | "session.id" | "trace.id" | "span.id"
> {
  if (!extra) {
    return {};
  }

  const traceparentHeader = extra.requestInfo?.headers
    ? getHeader(extra.requestInfo.headers, "traceparent")
    : undefined;
  const traceContext = traceparentHeader
    ? parseTraceparent(traceparentHeader)
    : undefined;

  return {
    requestId: extra.requestId,
    sessionId: extra.sessionId,
    traceId: traceContext?.traceId,
    spanId: traceContext?.spanId,
    "request.id": extra.requestId,
    "session.id": extra.sessionId,
    "trace.id": traceContext?.traceId,
    "span.id": traceContext?.spanId,
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function emitLog(payload: ExecutionStartLog | ExecutionEndLog): void {
  const request = payload["request.id"] ?? "-";
  const duration = payload.phase === "end" ? payload.durationMs : "-";
  const outcome = payload.phase === "end" ? payload["event.outcome"] : "-";
  const level = payload["log.level"].toUpperCase();

  const prefix = `${payload["@timestamp"]} ${level} ${payload["event.action"]} ${payload.type}/${payload.name} req=${request} dur=${duration} outcome=${outcome}`;
  console.error(`${prefix} | ${JSON.stringify(payload)}`);
}

export function logExecutionStart(options: {
  type: ExecutionType;
  name: string;
  input: unknown;
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>;
}): number {
  const startedAt = Date.now();

  if (!isObservabilityEnabled()) {
    return startedAt;
  }

  const timestamp = new Date(startedAt).toISOString();
  const context = getContext(options.extra);
  const payload: ExecutionStartLog = {
    source: "xmcp",
    category: "execution",
    phase: "start",
    type: options.type,
    name: options.name,
    timestamp,
    "@timestamp": timestamp,
    "ecs.version": "8.11.0",
    "event.kind": "event",
    "event.category": ["application"],
    "event.action": `${options.type}.start`,
    "log.level": "info",
    input: redact(options.input),
    ...context,
  };

  emitLog(payload);
  return startedAt;
}

export function logExecutionEnd(options: {
  type: ExecutionType;
  name: string;
  startedAt: number;
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>;
  error?: unknown;
  outputSummary?: unknown;
}): void {
  if (!isObservabilityEnabled()) {
    return;
  }

  const endedAt = Date.now();
  const timestamp = new Date(endedAt).toISOString();
  const durationMs = Math.max(0, endedAt - options.startedAt);
  const context = getContext(options.extra);
  const success = options.error === undefined;

  const payload: ExecutionEndLog = {
    source: "xmcp",
    category: "execution",
    phase: "end",
    type: options.type,
    name: options.name,
    timestamp,
    "@timestamp": timestamp,
    "ecs.version": "8.11.0",
    "event.kind": "event",
    "event.category": ["application"],
    "event.action": `${options.type}.end`,
    "log.level": success ? "info" : "error",
    durationMs,
    success,
    "event.duration": durationMs * 1_000_000,
    "event.outcome": success ? "success" : "failure",
    ...(options.error !== undefined
      ? {
          errorMessage: toErrorMessage(options.error),
          "error.message": toErrorMessage(options.error),
        }
      : {}),
    ...(success && options.outputSummary !== undefined
      ? { outputSummary: redact(options.outputSummary) }
      : {}),
    ...context,
  };

  emitLog(payload);
}

export function summarizeToolOutput(result: CallToolResult): unknown {
  const content = Array.isArray(result?.content) ? result.content : [];
  const contentTypes = Array.from(
    new Set(
      content
        .map((item) =>
          item && typeof item === "object" && "type" in item
            ? String((item as any).type)
            : "unknown"
        )
        .filter(Boolean)
    )
  );

  const firstText = content.find(
    (item) => item && typeof item === "object" && (item as any).type === "text"
  ) as any;

  return {
    contentCount: content.length,
    contentTypes,
    hasStructuredContent: "structuredContent" in result,
    textPreview:
      firstText && typeof firstText.text === "string"
        ? truncate(firstText.text)
        : undefined,
  };
}

export function summarizePromptOutput(result: GetPromptResult): unknown {
  const messages = Array.isArray(result?.messages) ? result.messages : [];
  const roles = Array.from(new Set(messages.map((m) => m.role)));
  const contentTypes = Array.from(
    new Set(
      messages.map((m) =>
        m?.content && typeof m.content === "object" && "type" in m.content
          ? String((m.content as any).type)
          : "unknown"
      )
    )
  );

  const firstText = messages.find(
    (m) =>
      m?.content &&
      typeof m.content === "object" &&
      (m.content as any).type === "text"
  )?.content as any;

  return {
    messageCount: messages.length,
    roles,
    contentTypes,
    textPreview:
      firstText && typeof firstText.text === "string"
        ? truncate(firstText.text)
        : undefined,
  };
}

export function summarizeResourceOutput(result: ReadResourceResult): unknown {
  const contents = Array.isArray(result?.contents) ? result.contents : [];
  const mimeTypes = Array.from(
    new Set(contents.map((item) => item.mimeType).filter(Boolean))
  );
  const hasBlob = contents.some(
    (item) => "blob" in item && typeof item.blob === "string"
  );
  const firstTextItem = contents.find(
    (item) => "text" in item && typeof item.text === "string"
  );
  const firstText =
    firstTextItem && "text" in firstTextItem ? firstTextItem.text : undefined;

  return {
    contentsCount: contents.length,
    mimeTypes,
    hasBlob,
    textPreview: typeof firstText === "string" ? truncate(firstText) : undefined,
  };
}
