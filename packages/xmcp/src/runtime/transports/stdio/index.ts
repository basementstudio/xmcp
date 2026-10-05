import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "../../utils/server";
import dotenv from "dotenv";
import {
  clientInfoContextProvider,
  setClientInfoContext,
} from "@/runtime/contexts/client-info-context";
import { mapImplementationToClientInfo } from "@/runtime/utils/client-info";
dotenv.config();

const debug = STDIO_CONFIG.debug || false;
const silent = STDIO_CONFIG.silent || false;

if (silent) {
  // Redirect all console methods to stderr so they don't interfere with
  // the MCP stdio protocol on stdout.
  const stderrConsole = new console.Console(process.stderr, process.stderr);
  const methods = [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "dir",
    "table",
    "trace",
    "assert",
    "time",
    "timeEnd",
    "timeLog",
    "count",
    "countReset",
    "group",
    "groupEnd",
    "groupCollapsed",
    "clear",
  ] as const;
  for (const method of methods) {
    (console as any)[method] = (stderrConsole as any)[method].bind(
      stderrConsole
    );
  }
}

function setupShutdownHandlers(): void {
  const shutdownHandler = () => {
    if (debug) {
      console.log("[STDIO] Shutting down STDIO transport");
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdownHandler);
  process.on("SIGTERM", shutdownHandler);
}

clientInfoContextProvider({ clientInfo: undefined }, () => {
  // serveStdio negotiates the protocol era at connection open: 2025-era
  // clients get the classic initialize handshake, 2026-07-28 clients carry
  // their identity in the per-request _meta envelope. The SDK backfills
  // getClientVersion() from the envelope, so the capture below works for
  // both eras.
  serveStdio(
    async () => {
      const server = await createServer();
      server.server.oninitialized = () => {
        const implementation = server.server.getClientVersion();
        const clientInfo = mapImplementationToClientInfo(implementation);
        setClientInfoContext({ clientInfo });

        if (debug && clientInfo) {
          console.log(
            `[STDIO] MCP client initialized: ${clientInfo.name}@${clientInfo.version}`
          );
        }
      };
      return server;
    },
    {
      legacy: "serve",
      onerror: debug
        ? (error) => console.error("[STDIO] Error:", error)
        : undefined,
    }
  );

  if (debug) {
    console.log("[STDIO] MCP Server running with STDIO transport");
  }
  setupShutdownHandlers();
});
