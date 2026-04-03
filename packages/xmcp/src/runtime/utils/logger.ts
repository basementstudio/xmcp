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

const SESSION_LOG_LEVEL_TTL_MS = 30 * 60 * 1000;
const sessionLogLevels = new Map<
  string,
  { level: LogLevel; expiresAt: number }
>();

function cleanupExpiredSessionLogLevels(now: number): void {
  for (const [sessionId, entry] of sessionLogLevels.entries()) {
    if (entry.expiresAt <= now) {
      sessionLogLevels.delete(sessionId);
    }
  }
}

export function setLogLevel(level: LogLevel, sessionId?: string): void {
  if (!sessionId) {
    return;
  }

  const now = Date.now();
  cleanupExpiredSessionLogLevels(now);
  sessionLogLevels.set(sessionId, {
    level,
    expiresAt: now + SESSION_LOG_LEVEL_TTL_MS,
  });
}

export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && LOG_LEVEL_SET.has(value as LogLevel);
}

function getCurrentLogLevel(sessionId?: string): LogLevel {
  if (!sessionId) {
    return "debug";
  }

  const now = Date.now();
  cleanupExpiredSessionLogLevels(now);

  const entry = sessionLogLevels.get(sessionId);
  if (!entry) {
    return "debug";
  }

  // Sliding TTL: keep active sessions alive.
  entry.expiresAt = now + SESSION_LOG_LEVEL_TTL_MS;
  return entry.level;
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

/**
 * Importable logger that resolves server/sessionId from async context.
 * Use inside any tool, prompt, or resource handler:
 *
 * ```ts
 * import { logger } from "xmcp";
 * logger.info("hello", "my-tool");
 * ```
 */
export const logger: Logger = {} as Logger;

for (const level of LOG_LEVELS) {
  logger[level] = (data: unknown, loggerName?: string) => {
    const ctx = loggerCtx.getContext();
    const sessionId = resolveSessionId(ctx.sessionId);
    if (!shouldLog(level, sessionId)) return;

    try {
      ctx.server.sendLoggingMessage(
        { level, logger: loggerName, data },
        sessionId
      );
    } catch {
      // Logging must never crash the caller.
    }
  };
}
