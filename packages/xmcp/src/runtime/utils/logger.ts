import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { createContext } from "../../utils/context";
import { getHttpRequestContext } from "../contexts/http-request-context";

export type LogLevel =
  | "debug"
  | "info"
  | "notice"
  | "warning"
  | "error"
  | "critical"
  | "alert"
  | "emergency";

export interface Logger {
  debug(data: unknown, loggerName?: string): void;
  info(data: unknown, loggerName?: string): void;
  notice(data: unknown, loggerName?: string): void;
  warning(data: unknown, loggerName?: string): void;
  error(data: unknown, loggerName?: string): void;
  critical(data: unknown, loggerName?: string): void;
  alert(data: unknown, loggerName?: string): void;
  emergency(data: unknown, loggerName?: string): void;
}

const LOG_LEVELS: LogLevel[] = [
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency",
];
const LOG_LEVEL_SET = new Set<LogLevel>(LOG_LEVELS);

const sessionLogLevels = new Map<string, LogLevel>();

export function setLogLevel(level: LogLevel, sessionId?: string): void {
  // No sessionId means the request is from a transport that can't correlate
  // future requests (e.g. stateless HTTP without a client-supplied
  // mcp-session-id). Storing under a synthetic key would silently leak across
  // unrelated clients, so the level is simply not persisted.
  if (!sessionId) return;
  sessionLogLevels.set(sessionId, level);
}

export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && LOG_LEVEL_SET.has(value as LogLevel);
}

function getCurrentLogLevel(sessionId?: string): LogLevel {
  if (!sessionId) return "debug";
  return sessionLogLevels.get(sessionId) ?? "debug";
}

function shouldLog(level: LogLevel, sessionId?: string): boolean {
  return (
    LOG_LEVELS.indexOf(level) >=
    LOG_LEVELS.indexOf(getCurrentLogLevel(sessionId))
  );
}

function getSessionIdFromHeaders(): string | undefined {
  try {
    const rawValue = getHttpRequestContext().headers["mcp-session-id"];
    if (Array.isArray(rawValue)) {
      return rawValue[0];
    }

    return rawValue;
  } catch {
    return undefined;
  }
}

function resolveSessionId(sessionId?: string): string | undefined {
  return sessionId ?? getSessionIdFromHeaders();
}

interface LoggerContext {
  server: McpServer;
  sessionId?: string;
}

const loggerCtx = createContext<LoggerContext>({
  name: "logger-context",
});

export const loggerContextProvider = loggerCtx.provider;

function getLoggerContext(): LoggerContext | undefined {
  try {
    return loggerCtx.getContext();
  } catch {
    return undefined;
  }
}

type LoggerMethod = (data: unknown, loggerName?: string) => void;

function makeLoggerMethod(level: LogLevel): LoggerMethod {
  return (data, loggerName) => {
    // Dropping undefined keeps the wire payload well-formed: JSON.stringify
    // would otherwise omit `data`, producing a notification missing the
    // field the spec says is required.
    if (data === undefined) return;

    const ctx = getLoggerContext();
    if (!ctx) return;

    const sessionId = resolveSessionId(ctx.sessionId);
    // Short-circuit before the SDK serializes the notification. The SDK runs
    // its own filter inside sendLoggingMessage, but only after building the
    // JSON-RPC message — bailing here keeps the hot path cheap.
    if (!shouldLog(level, sessionId)) return;

    try {
      ctx.server.sendLoggingMessage(
        { level, logger: loggerName, data },
        sessionId
      );
    } catch (err) {
      // Logging must never crash the caller. In development surface the
      // failure on stderr so circular refs / BigInt / unserialisable values
      // don't disappear silently. stderr (not console.warn) avoids the
      // valerules hook and is safe in stdio mode.
      if (process.env.NODE_ENV !== "production") {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(
          `[xmcp logger] dropped ${level} message from ${loggerName ?? "<anonymous>"}: ${message}\n`
        );
      }
    }
  };
}

/**
 * Importable logger that resolves server/sessionId from async context.
 * Use inside any tool, prompt, or resource handler:
 *
 * ```ts
 * import { logger } from "xmcp";
 * logger.warning("hello", "my-tool");
 * ```
 */
// Using Record<LogLevel, ...> rather than a runtime loop so the compiler
// errors if a level is added to LogLevel and not wired up here.
const loggerMethods: Record<LogLevel, LoggerMethod> = {
  debug: makeLoggerMethod("debug"),
  info: makeLoggerMethod("info"),
  notice: makeLoggerMethod("notice"),
  warning: makeLoggerMethod("warning"),
  error: makeLoggerMethod("error"),
  critical: makeLoggerMethod("critical"),
  alert: makeLoggerMethod("alert"),
  emergency: makeLoggerMethod("emergency"),
};

export const logger: Logger = loggerMethods;
