import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { Request, Response } from "express";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createServer } from "@/runtime/utils/server";
import { setHeaders } from "@/runtime/transports/http/cors";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";
import type { CorsConfig } from "@/config";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";

const corsConfig = HTTP_CORS_CONFIG as CorsConfig;

const httpConfig = HTTP_CONFIG as {
  port: number;
  host: string;
  bodySizeLimit: number;
  endpoint: string;
  debug: boolean;
};

// A fresh McpServer is built per request; no state survives between requests.
// 2026-07-28 traffic is served natively, 2025-era traffic through the SDK's
// stateless fallback.
const mcpHandler = createMcpHandler(createServer, {
  legacy: "stateless",
});
const nodeMcpHandler = toNodeHandler(mcpHandler);

@Injectable()
export class XmcpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(XmcpService.name);

  onModuleInit() {
    this.logger.log("xmcp service initialized");
  }

  onModuleDestroy() {
    this.logger.log("xmcp service shutting down");
  }

  async handleRequest(req: Request, res: Response): Promise<void> {
    const requestId = randomUUID();
    const startTime = Date.now();

    this.logger.debug(`Request ${requestId} started`);

    const clientInfo = extractClientInfoFromMessages(req.body);

    return httpRequestContextProvider(
      { id: requestId, headers: req.headers, clientInfo },
      async () => {
        try {
          setHeaders(res, corsConfig, req.headers.origin);

          // The body was already parsed by the framework; req.auth (attached
          // by auth middleware) is forwarded automatically.
          await nodeMcpHandler(req, res, req.body);

          const duration = Date.now() - startTime;
          this.logger.debug(`Request ${requestId} completed in ${duration}ms`);
        } catch (error) {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Request ${requestId} failed after ${duration}ms`,
            error instanceof Error ? error.stack : String(error)
          );
          if (!res.headersSent) {
            res.status(500).json({
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
    );
  }
}
