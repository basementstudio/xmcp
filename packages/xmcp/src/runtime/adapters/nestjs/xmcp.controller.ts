import { Controller, Post, Get, Options, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { XmcpService } from "./xmcp.service";

@Controller("mcp")
export class XmcpController {
  constructor(private readonly xmcpService: XmcpService) {}

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

  @Options()
  handleOptions(@Res() res: Response): void {
    res.status(204).send();
  }
}
