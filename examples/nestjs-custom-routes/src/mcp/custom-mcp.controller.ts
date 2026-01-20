import { Controller, Post, Get, Options, Req, Res, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { XmcpService } from "@xmcp/adapter";

/**
 * Custom MCP controller with a custom route path.
 *
 * Instead of the default /mcp endpoint provided by XmcpModule,
 * this controller exposes MCP at /api/v1/mcp.
 *
 * Benefits of custom routes:
 * - API versioning (e.g., /api/v1/mcp, /api/v2/mcp)
 * - Custom path prefixes for organizational purposes
 * - Multiple MCP endpoints with different configurations
 * - Integration with existing API structures
 */
@Controller("api/v1/mcp")
export class CustomMcpController {
  private readonly logger = new Logger(CustomMcpController.name);

  constructor(private readonly xmcpService: XmcpService) {}

  /**
   * Main MCP endpoint at /api/v1/mcp
   *
   * This is functionally equivalent to the default XmcpController
   * but mounted at a custom path.
   */
  @Post()
  async handleMcp(@Req() req: Request, @Res() res: Response): Promise<void> {
    this.logger.log("Handling MCP request at /api/v1/mcp");
    return this.xmcpService.handleRequest(req, res);
  }

  @Get()
  handleGet(@Res() res: Response): void {
    this.logger.debug("GET request received - returning method not allowed");
    res.status(200).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed. MCP requires POST requests.",
      },
      id: null,
    });
  }

  @Options()
  handleOptions(@Res() res: Response): void {
    this.logger.debug("OPTIONS request received - CORS preflight");
    res.status(204).send();
  }
}
