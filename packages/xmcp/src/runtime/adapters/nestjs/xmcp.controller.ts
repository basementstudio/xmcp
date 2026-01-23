import { Post, Get, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { xmcpService } from "./xmcp.service";

export class xmcpController {
  constructor(private readonly xmcpService: xmcpService) {}

  @Post()
  async handleMcp(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.xmcpService.handleRequest(req, res);
  }

  @Get()
  handleGet(@Res() res: Response): void {
    res.status(200).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed. MCP requires POST requests.",
      },
      id: null,
    });
  }
}
