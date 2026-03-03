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
type SinkErrorHandling = "silent" | "warn";
type SinkHttpMethod = "POST" | "PUT";

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

export type ExecutionStartLog = ExecutionLogCommon & {
  schemaVersion: 1;
  phase: "start";
  input: unknown;
};

export type ExecutionEndLog = ExecutionLogCommon & {
  schemaVersion: 1;
  phase: "end";
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  outputSummary?: unknown;
  "event.duration": number;
  "event.outcome": "success" | "failure";
  "error.message"?: string;
};

export type ExecutionEvent = ExecutionStartLog | ExecutionEndLog;

export type ObservabilityRedactionConfig = {
  extraSensitiveKeys?: string[];
  allowedKeys?: string[];
};

export type RuntimeObservabilityConfig = {
  enabled: boolean;
  stderr: boolean;
  sinkTimeoutMs: number;
  maxQueueSize: number;
  maxConcurrentSends: number;
  onSinkError: SinkErrorHandling;
  sinks: ConfiguredObservabilitySink[];
  redaction: {
    extraSensitiveKeys: string[];
    allowedKeys: string[];
  };
};

export type ObservabilitySink = (
  event: ExecutionEvent
) => void | Promise<void>;

type RuntimeObservabilityOverrides = Omit<
  Partial<RuntimeObservabilityConfig>,
  "redaction"
> & {
  redaction?: Partial<RuntimeObservabilityConfig["redaction"]>;
};

export type WebhookObservabilitySinkConfig = {
  type: "webhook";
  url: string;
  method?: SinkHttpMethod;
  headers?: Record<string, string>;
};

export type LokiObservabilitySinkConfig = {
  type: "loki";
  url: string;
  headers?: Record<string, string>;
  tenantId?: string;
  labels?: Record<string, string>;
};

export type DatadogObservabilitySinkConfig = {
  type: "datadog";
  apiKey: string;
  site?: "us1" | "us3" | "us5" | "eu" | "ap1" | "ap2" | "us1-fed";
  url?: string;
  ddsource?: string;
  service?: string;
  ddtags?: string;
  headers?: Record<string, string>;
};

export type ConfiguredObservabilitySink =
  | WebhookObservabilitySinkConfig
  | LokiObservabilitySinkConfig
  | DatadogObservabilitySinkConfig;

declare const OBSERVABILITY: boolean | undefined;
declare const OBSERVABILITY_CONFIG: RuntimeObservabilityConfig | undefined;
declare const IS_CLOUDFLARE: boolean | undefined;

const DEFAULT_OBSERVABILITY_CONFIG: RuntimeObservabilityConfig = {
  enabled: false,
  stderr: true,
  sinkTimeoutMs: 1000,
  maxQueueSize: 1000,
  maxConcurrentSends: 4,
  onSinkError: "warn",
  sinks: [],
  redaction: {
    extraSensitiveKeys: [],
    allowedKeys: [],
  },
};

const SENSITIVE_KEY_PATTERN =
  /authorization|token|access[_-]?token|refresh[_-]?token|password|secret|api[_-]?key|apikey|cookie|set-cookie/i;

const MAX_STRING_LENGTH = 2000;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 100;

const registeredSinks = new Set<ObservabilitySink>();
const pendingDispatchQueue: Array<{
  sink: ObservabilitySink;
  event: ExecutionEvent;
  config: RuntimeObservabilityConfig;
}> = [];
let activeDispatches = 0;
let runtimeConfigOverrides: RuntimeObservabilityOverrides = {};
let configuredSinksSignature = "";
let configuredSinkUnsubscribes: Array<() => void> = [];

function resolveEnabledFlag(): boolean {
  if (typeof OBSERVABILITY !== "undefined") {
    return Boolean(OBSERVABILITY);
  }

  // Test fallback when runtime injection is not available.
  return process.env.XMCP_OBSERVABILITY_TEST === "true";
}

function normalizeRuntimeConfig(
  config: RuntimeObservabilityOverrides
): RuntimeObservabilityConfig {
  return {
    ...DEFAULT_OBSERVABILITY_CONFIG,
    ...config,
    redaction: {
      ...DEFAULT_OBSERVABILITY_CONFIG.redaction,
      ...(config.redaction ?? {}),
    },
  };
}

export function getObservabilityConfig(): RuntimeObservabilityConfig {
  const injectedConfig =
    typeof OBSERVABILITY_CONFIG === "object" && OBSERVABILITY_CONFIG !== null
      ? OBSERVABILITY_CONFIG
      : undefined;
  const enabledFlag = resolveEnabledFlag();

  const merged = normalizeRuntimeConfig({
    ...(injectedConfig ?? {}),
    ...runtimeConfigOverrides,
    enabled:
      runtimeConfigOverrides.enabled ??
      injectedConfig?.enabled ??
      enabledFlag,
    redaction: {
      ...(injectedConfig?.redaction ?? {}),
      ...(runtimeConfigOverrides.redaction ?? {}),
    },
  });

  return merged;
}

export function setObservabilityConfig(
  config: RuntimeObservabilityOverrides
): void {
  runtimeConfigOverrides = {
    ...runtimeConfigOverrides,
    ...config,
    redaction: {
      ...(runtimeConfigOverrides.redaction ?? {}),
      ...(config.redaction ?? {}),
    },
  };
}

export function registerObservabilitySink(
  sink: ObservabilitySink
): () => void {
  registeredSinks.add(sink);
  return () => {
    registeredSinks.delete(sink);
  };
}

export function clearObservabilitySinks(): void {
  registeredSinks.clear();
}

export function isObservabilityEnabled(): boolean {
  return getObservabilityConfig().enabled;
}

function truncate(value: string, maxLen: number = 200): string {
  if (value.length <= maxLen) {
    return value;
  }
  return `${value.slice(0, maxLen)}...`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isSensitiveKey(
  key: string,
  redactionConfig: RuntimeObservabilityConfig["redaction"]
): boolean {
  const normalizedKey = key.toLowerCase();
  const allowedKeys = new Set(
    redactionConfig.allowedKeys.map((item) => item.toLowerCase())
  );

  if (allowedKeys.has(normalizedKey)) {
    return false;
  }

  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return true;
  }

  if (redactionConfig.extraSensitiveKeys.length === 0) {
    return false;
  }

  const customPattern = new RegExp(
    redactionConfig.extraSensitiveKeys.map(escapeRegex).join("|"),
    "i"
  );

  return customPattern.test(key);
}

function sanitizeValue(
  value: unknown,
  seen: WeakSet<object>,
  redactionConfig: RuntimeObservabilityConfig["redaction"]
): unknown {
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
    const mapped = limited.map((item) =>
      sanitizeValue(item, seen, redactionConfig)
    );
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
      if (isSensitiveKey(key, redactionConfig)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeValue(child, seen, redactionConfig);
      }
    }

    if (entries.length > MAX_OBJECT_KEYS) {
      result.__truncatedKeys = entries.length - MAX_OBJECT_KEYS;
    }

    return result;
  }

  return String(value);
}

function redact(
  value: unknown,
  redactionConfig: RuntimeObservabilityConfig["redaction"]
): unknown {
  return sanitizeValue(value, new WeakSet<object>(), redactionConfig);
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
  | "requestId"
  | "sessionId"
  | "traceId"
  | "spanId"
  | "request.id"
  | "session.id"
  | "trace.id"
  | "span.id"
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

function emitLogToStderr(payload: ExecutionEvent): void {
  const request = payload["request.id"] ?? "-";
  const duration = payload.phase === "end" ? payload.durationMs : "-";
  const outcome = payload.phase === "end" ? payload["event.outcome"] : "-";
  const level = payload["log.level"].toUpperCase();

  const prefix = `${payload["@timestamp"]} ${level} ${payload["event.action"]} ${payload.type}/${payload.name} req=${request} dur=${duration} outcome=${outcome}`;
  console.error(`${prefix} | ${JSON.stringify(payload)}`);
}

function emitSinkWarning(config: RuntimeObservabilityConfig, message: string): void {
  if (config.onSinkError !== "warn") {
    return;
  }

  console.error(`[xmcp][observability] ${message}`);
}

function cleanupConfiguredSinks(): void {
  for (const unsubscribe of configuredSinkUnsubscribes) {
    unsubscribe();
  }
  configuredSinkUnsubscribes = [];
}

function getCloudflareFlag(): boolean {
  return typeof IS_CLOUDFLARE !== "undefined" && Boolean(IS_CLOUDFLARE);
}

function toUnixTimeNanos(timestamp: string): string {
  const millis = Date.parse(timestamp);
  const safeMillis = Number.isFinite(millis) ? millis : Date.now();
  return `${safeMillis * 1_000_000}`;
}

function toEventMessage(event: ExecutionEvent): string {
  if (event.phase === "end") {
    return `${event["event.action"]} ${event.type}/${event.name} outcome=${event["event.outcome"]} durationMs=${event.durationMs}`;
  }

  return `${event["event.action"]} ${event.type}/${event.name}`;
}

function getDatadogLogsUrl(sinkConfig: DatadogObservabilitySinkConfig): string {
  if (sinkConfig.url) {
    return sinkConfig.url;
  }

  const site = sinkConfig.site ?? "us1";
  const hostBySite: Record<NonNullable<DatadogObservabilitySinkConfig["site"]>, string> = {
    us1: "http-intake.logs.datadoghq.com",
    us3: "http-intake.logs.us3.datadoghq.com",
    us5: "http-intake.logs.us5.datadoghq.com",
    eu: "http-intake.logs.datadoghq.eu",
    ap1: "http-intake.logs.ap1.datadoghq.com",
    ap2: "http-intake.logs.ap2.datadoghq.com",
    "us1-fed": "http-intake.logs.ddog-gov.com",
  };

  return `https://${hostBySite[site]}/v1/input`;
}

function createSinkFromConfig(
  sinkConfig: ConfiguredObservabilitySink
): ObservabilitySink {
  if (sinkConfig.type === "webhook") {
    return async (event) => {
      const response = await fetch(sinkConfig.url, {
        method: sinkConfig.method ?? "POST",
        headers: {
          "content-type": "application/json",
          ...(sinkConfig.headers ?? {}),
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`webhook sink failed with status ${response.status}`);
      }
    };
  }

  if (sinkConfig.type === "datadog") {
    const logsUrl = getDatadogLogsUrl(sinkConfig);

    return async (event) => {
      const response = await fetch(logsUrl, {
        method: "POST",
        headers: {
          "DD-API-KEY": sinkConfig.apiKey,
          "content-type": "application/json",
          ...(sinkConfig.headers ?? {}),
        },
        body: JSON.stringify({
          ...event,
          message: toEventMessage(event),
          ddsource: sinkConfig.ddsource ?? "xmcp",
          ...(sinkConfig.service ? { service: sinkConfig.service } : {}),
          ...(sinkConfig.ddtags ? { ddtags: sinkConfig.ddtags } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`datadog sink failed with status ${response.status}`);
      }
    };
  }

  const labels = {
    source: "xmcp",
    ...(sinkConfig.labels ?? {}),
  };

  return async (event) => {
    const response = await fetch(sinkConfig.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(sinkConfig.tenantId
          ? { "X-Scope-OrgID": sinkConfig.tenantId }
          : {}),
        ...(sinkConfig.headers ?? {}),
      },
      body: JSON.stringify({
        streams: [
          {
            stream: labels,
            values: [[toUnixTimeNanos(event["@timestamp"]), JSON.stringify(event)]],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`loki sink failed with status ${response.status}`);
    }
  };
}

function syncConfiguredSinks(config: RuntimeObservabilityConfig): void {
  if (getCloudflareFlag()) {
    if (configuredSinkUnsubscribes.length > 0) {
      cleanupConfiguredSinks();
      configuredSinksSignature = "";
    }
    return;
  }

  const signature = JSON.stringify(config.sinks ?? []);
  if (signature === configuredSinksSignature) {
    return;
  }

  cleanupConfiguredSinks();
  configuredSinksSignature = signature;

  for (const sinkConfig of config.sinks ?? []) {
    const sink = createSinkFromConfig(sinkConfig);
    const unsubscribe = registerObservabilitySink(sink);
    configuredSinkUnsubscribes.push(unsubscribe);
  }
}

function queueSinkDispatch(
  sink: ObservabilitySink,
  event: ExecutionEvent,
  config: RuntimeObservabilityConfig
): void {
  if (pendingDispatchQueue.length >= config.maxQueueSize) {
    emitSinkWarning(config, "dropping observability event: sink queue is full");
    return;
  }

  pendingDispatchQueue.push({ sink, event, config });
  void drainSinkQueue();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) {
    return promise;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`sink timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

async function drainSinkQueue(): Promise<void> {
  while (pendingDispatchQueue.length > 0) {
    const nextConfig = pendingDispatchQueue[0]?.config;
    if (!nextConfig) {
      return;
    }

    if (activeDispatches >= nextConfig.maxConcurrentSends) {
      return;
    }

    const item = pendingDispatchQueue.shift();
    if (!item) {
      return;
    }

    activeDispatches += 1;

    const sinkCall = Promise.resolve(item.sink(item.event));
    withTimeout(sinkCall, item.config.sinkTimeoutMs)
      .catch((error) => {
        emitSinkWarning(
          item.config,
          `sink delivery failed: ${toErrorMessage(error)}`
        );
      })
      .finally(() => {
        activeDispatches = Math.max(0, activeDispatches - 1);
        void drainSinkQueue();
      });
  }
}

function dispatchToSinks(
  payload: ExecutionEvent,
  config: RuntimeObservabilityConfig
): void {
  if (getCloudflareFlag()) {
    return;
  }

  if (registeredSinks.size === 0) {
    return;
  }

  for (const sink of registeredSinks) {
    queueSinkDispatch(sink, payload, config);
  }
}

function emitLog(payload: ExecutionEvent, config: RuntimeObservabilityConfig): void {
  syncConfiguredSinks(config);

  if (config.stderr) {
    emitLogToStderr(payload);
  }

  dispatchToSinks(payload, config);
}

export function logExecutionStart(options: {
  type: ExecutionType;
  name: string;
  input: unknown;
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>;
}): number {
  const startedAt = Date.now();
  const config = getObservabilityConfig();

  if (!config.enabled) {
    return startedAt;
  }

  const timestamp = new Date(startedAt).toISOString();
  const context = getContext(options.extra);
  const payload: ExecutionStartLog = {
    schemaVersion: 1,
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
    input: redact(options.input, config.redaction),
    ...context,
  };

  emitLog(payload, config);
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
  const config = getObservabilityConfig();
  if (!config.enabled) {
    return;
  }

  const endedAt = Date.now();
  const timestamp = new Date(endedAt).toISOString();
  const durationMs = Math.max(0, endedAt - options.startedAt);
  const context = getContext(options.extra);
  const success = options.error === undefined;

  const payload: ExecutionEndLog = {
    schemaVersion: 1,
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
      ? { outputSummary: redact(options.outputSummary, config.redaction) }
      : {}),
    ...context,
  };

  emitLog(payload, config);
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

export function _resetObservabilityStateForTests(): void {
  cleanupConfiguredSinks();
  configuredSinksSignature = "";
  clearObservabilitySinks();
  pendingDispatchQueue.length = 0;
  activeDispatches = 0;
  runtimeConfigOverrides = {};
}
