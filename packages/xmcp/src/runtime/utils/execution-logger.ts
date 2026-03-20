export type ExecutionKind = "tool" | "prompt" | "resource";

export type ExecutionLogConfig = {
  enabled: boolean;
  includeInput: boolean;
};

type ExecutionLogEvent = "execution.start" | "execution.end";

type ExecutionLogPayload = {
  event: ExecutionLogEvent;
  kind: ExecutionKind;
  name: string;
  timestamp: string;
  durationMs?: number;
  success?: boolean;
  input?: unknown;
  error?: string;
};

declare const OBSERVABILITY_CONFIG: ExecutionLogConfig | undefined;

const defaultExecutionLogConfig: ExecutionLogConfig = {
  enabled: false,
  includeInput: true,
};

export function getExecutionLogConfig(): ExecutionLogConfig {
  if (
    typeof OBSERVABILITY_CONFIG === "undefined" &&
    typeof globalThis !== "undefined" &&
    "OBSERVABILITY_CONFIG" in globalThis
  ) {
    return {
      ...defaultExecutionLogConfig,
      ...((globalThis as { OBSERVABILITY_CONFIG?: ExecutionLogConfig })
        .OBSERVABILITY_CONFIG ?? {}),
    };
  }

  if (typeof OBSERVABILITY_CONFIG === "undefined") {
    return defaultExecutionLogConfig;
  }

  return {
    ...defaultExecutionLogConfig,
    ...OBSERVABILITY_CONFIG,
  };
}

function safeSerializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "bigint") {
    return error.toString();
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, currentValue) => {
    if (typeof currentValue === "bigint") {
      return currentValue.toString();
    }

    if (typeof currentValue === "object" && currentValue !== null) {
      if (seen.has(currentValue)) {
        return "[Circular]";
      }

      seen.add(currentValue);
    }

    return currentValue;
  });
}

function writeExecutionLog(payload: ExecutionLogPayload): void {
  try {
    const line = safeStringify({
      scope: "xmcp",
      ...payload,
    });

    if (
      typeof process !== "undefined" &&
      process?.stderr &&
      typeof process.stderr.write === "function"
    ) {
      process.stderr.write(`${line}\n`);
      return;
    }
  } catch {
    try {
      const fallbackLine = JSON.stringify({
        scope: "xmcp",
        event: payload.event,
        kind: payload.kind,
        name: payload.name,
        timestamp: payload.timestamp,
        durationMs: payload.durationMs,
        success: payload.success,
        error:
          payload.error ??
          "Failed to serialize observability payload; emitted fallback log",
      });

      if (
        typeof process !== "undefined" &&
        process?.stderr &&
        typeof process.stderr.write === "function"
      ) {
        process.stderr.write(`${fallbackLine}\n`);
        return;
      }
    } catch {
      return;
    }
  }
}

export async function withExecutionLogging<T>(
  options: {
    kind: ExecutionKind;
    name: string;
    input?: unknown;
    handler: () => T | Promise<T>;
    isFailureResult?: (result: T) => boolean;
    getFailureError?: (result: T) => string | undefined;
  },
  config: ExecutionLogConfig = getExecutionLogConfig()
): Promise<T> {
  if (!config.enabled) {
    return options.handler();
  }

  const startedAt = Date.now();
  writeExecutionLog({
    event: "execution.start",
    kind: options.kind,
    name: options.name,
    timestamp: new Date(startedAt).toISOString(),
    ...(config.includeInput ? { input: options.input } : {}),
  });

  try {
    const result = await options.handler();
    const finishedAt = Date.now();
    const isFailureResult = options.isFailureResult?.(result) ?? false;

    writeExecutionLog({
      event: "execution.end",
      kind: options.kind,
      name: options.name,
      timestamp: new Date(finishedAt).toISOString(),
      durationMs: finishedAt - startedAt,
      success: !isFailureResult,
      ...(isFailureResult
        ? { error: options.getFailureError?.(result) }
        : {}),
    });

    return result;
  } catch (error) {
    const finishedAt = Date.now();

    writeExecutionLog({
      event: "execution.end",
      kind: options.kind,
      name: options.name,
      timestamp: new Date(finishedAt).toISOString(),
      durationMs: finishedAt - startedAt,
      success: false,
      error: safeSerializeError(error),
    });

    throw error;
  }
}
