import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../../utils/server";
import dotenv from "dotenv";
import {
  clientInfoContextProvider,
  setClientInfoContext,
} from "@/runtime/contexts/client-info-context";
import { mapImplementationToClientInfo } from "@/runtime/utils/client-info";
dotenv.config();

class StdioTransport {
  private mcpServer: McpServer;
  private transport: StdioServerTransport;
  private debug: boolean;

  constructor(mcpServer: McpServer, debug: boolean = false) {
    this.mcpServer = mcpServer;
    this.transport = new StdioServerTransport();
    this.debug = debug;
  }

  public start(): void {
    try {
      this.mcpServer.server.oninitialized = () => {
        const implementation = this.mcpServer.server.getClientVersion();
        const clientInfo = mapImplementationToClientInfo(implementation);
        setClientInfoContext({ clientInfo });

        if (this.debug && clientInfo) {
          console.log(
            `[STDIO] MCP client initialized: ${clientInfo.name}@${clientInfo.version}`
          );
        }
      };

      this.mcpServer.connect(this.transport);
      if (this.debug) {
        console.log("[STDIO] MCP Server running with STDIO transport");
      }
      this.setupShutdownHandlers();
    } catch (error) {
      if (this.debug) {
        console.error("[STDIO] Error starting STDIO transport:", error);
      }
      process.exit(1);
    }
  }

  private setupShutdownHandlers(): void {
    const shutdownHandler = () => {
      if (this.debug) {
        console.log("[STDIO] Shutting down STDIO transport");
      }
      process.exit(0);
    };

    process.on("SIGINT", shutdownHandler);
    process.on("SIGTERM", shutdownHandler);
  }

  public shutdown(): void {
    if (this.debug) {
      console.log("[STDIO] Shutting down STDIO transport");
    }
    process.exit(0);
  }
}

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

createServer().then((mcpServer) => {
  const stdioTransport = new StdioTransport(mcpServer, debug);
  clientInfoContextProvider({ clientInfo: undefined }, () => {
    stdioTransport.start();
  });
});
