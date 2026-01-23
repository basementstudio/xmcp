import { Controller, Post, Get, Options, Req, Res, UseFilters } from "@nestjs/common";
import { Request, Response } from "express";
import { XmcpService } from "./xmcp.service";
import { XmcpExceptionFilter } from "./xmcp.filter";

@Controller("mcp")
@UseFilters(XmcpExceptionFilter)
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
}
