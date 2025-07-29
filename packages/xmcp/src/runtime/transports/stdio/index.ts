import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../../utils/server";
import terminalLink from "terminal-link";

class StdioTransport {
  private mcpServer: McpServer;
  private transport: StdioServerTransport;
  private debug: boolean;

  constructor(mcpServer: McpServer, debug = false) {
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
      this.displayAddToCursorButton();
      this.setupShutdownHandlers();
    } catch (error) {
      if (this.debug) {
        console.error("[STDIO] Error starting STDIO transport:", error);
      }
      process.exit(1);
    }
  }

  private displayAddToCursorButton(): void {
    // @ts-expect-error: injected by compiler
    const projectPath = STDIO_CONFIG.projectPath;
    
    // Create the configuration object for Cursor
    const config = {
      command: "node",
      args: [`${projectPath}/dist/stdio.js`]
    };
    
    // Encode the configuration as base64
    const encodedConfig = Buffer.from(JSON.stringify(config)).toString('base64');
    
    // Create the proper Cursor deep link URL
    const cursorUrl = `cursor://anysphere.cursor-deeplink/mcp/install?name=xmcp-server&config=${encodedConfig}`;
    
    // Create a clickable link using terminal-link
    const link = terminalLink("Click me to add this MCP server to Cursor", cursorUrl);
    
    console.log(`\n${link}`);
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
