import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../../utils/server";
import dotenv from "dotenv";
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

// @ts-expect-error: injected by compiler
const debug = STDIO_CONFIG.debug || false;

createServer().then((mcpServer) => {
  const stdioTransport = new StdioTransport(mcpServer, debug);
  stdioTransport.start();
});
