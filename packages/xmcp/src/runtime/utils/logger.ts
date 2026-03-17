import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { createContext } from "../../utils/context";

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
    ctx.server.sendLoggingMessage(
      { level, logger: loggerName, data },
      ctx.sessionId
    );
  };
}
