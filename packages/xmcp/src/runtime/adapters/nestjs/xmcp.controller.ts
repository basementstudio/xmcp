import { Post, Get, Options, Req, Res, Header } from "@nestjs/common";
import { Request, Response } from "express";
import { XmcpService } from "./xmcp.service";

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
  @Header("Access-Control-Allow-Origin", "*")
  @Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  @Header("Access-Control-Allow-Headers", "*")
  @Header("Access-Control-Max-Age", "86400")
  handleOptions(@Res() res: Response): void {
    res.status(204).send();
  }
}
