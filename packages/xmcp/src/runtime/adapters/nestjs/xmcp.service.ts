import { Injectable, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { createServer } from "@/runtime/utils/server";
import { StatelessHttpServerTransport } from "@/runtime/transports/http/stateless-streamable-http";
import { setHeaders } from "@/runtime/transports/http/cors";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";
import type { CorsConfig } from "@/compiler/config";

// @ts-expect-error: injected by compiler
const corsConfig = HTTP_CORS_CONFIG as CorsConfig;

// @ts-expect-error: injected by compiler
const httpConfig = HTTP_CONFIG as {
  port: number;
  host: string;
  bodySizeLimit: number;
  endpoint: string;
  debug: boolean;
};

@Injectable()
export class XmcpService {
  private readonly logger = new Logger(XmcpService.name);

  async handleRequest(req: Request, res: Response): Promise<void> {
    const requestId = randomUUID();
    const startTime = Date.now();

    this.logger.debug(`Request ${requestId} started`);

    return new Promise((resolve) => {
      httpRequestContextProvider({ id: requestId, headers: req.headers }, async () => {
        try {
          setHeaders(res, corsConfig, req.headers.origin);

          const server = await createServer();
          const transport = new StatelessHttpServerTransport(
            httpConfig.debug,
            String(httpConfig.bodySizeLimit) || "10mb"
          );

          // cleanup when request/connection closes
          res.on("close", () => {
            transport.close();
            server.close();
          });

          await server.connect(transport);

          await transport.handleRequest(req, res, req.body).then(() => {
            const duration = Date.now() - startTime;
            this.logger.debug(`Request ${requestId} completed in ${duration}ms`);
            resolve();
          });
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
          resolve();
        }
      });
    });
  }
}
