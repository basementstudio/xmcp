import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class XmcpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(XmcpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      "MCP request failed",
      exception instanceof Error ? exception.stack : String(exception)
    );

    if (!response.headersSent) {
      response.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
}
