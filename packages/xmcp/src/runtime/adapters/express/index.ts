import { Request, Response } from "express";
import { createServer } from "@/runtime/utils/server";
import { StatelessHttpServerTransport } from "@/runtime/transports/http/stateless-streamable-http";
import { setHeaders } from "@/runtime/transports/http/cors";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";

// cors config
// @ts-expect-error: injected by compiler
const corsOrigin = HTTP_CORS_ORIGIN as string;
// @ts-expect-error: injected by compiler
const corsMethods = HTTP_CORS_METHODS as string;
// @ts-expect-error: injected by compiler
const corsAllowedHeaders = HTTP_CORS_ALLOWED_HEADERS as string;
// @ts-expect-error: injected by compiler
const corsExposedHeaders = HTTP_CORS_EXPOSED_HEADERS as string;
// @ts-expect-error: injected by compiler
const corsCredentials = HTTP_CORS_CREDENTIALS as boolean;
// @ts-expect-error: injected by compiler
const corsMaxAge = HTTP_CORS_MAX_AGE as number;
// @ts-expect-error: injected by compiler
const debug = HTTP_DEBUG as boolean;
// @ts-expect-error: injected by compiler
const bodySizeLimit = HTTP_BODY_SIZE_LIMIT as string;

export async function xmcpHandler(req: Request, res: Response) {
  return new Promise((resolve) => {
    const id = randomUUID();
    httpRequestContextProvider({ id, headers: req.headers }, async () => {
      try {
        setHeaders(
          res,
          {
            origin: corsOrigin,
            methods: corsMethods,
            allowedHeaders: corsAllowedHeaders,
            exposedHeaders: corsExposedHeaders,
            credentials: corsCredentials,
            maxAge: corsMaxAge,
          },
          req.headers.origin
        );

        const server = await createServer();
        const transport = new StatelessHttpServerTransport(
          debug,
          bodySizeLimit || "10mb"
        );

        // cleanup when request/connection closes
        res.on("close", () => {
          transport.close();
          server.close();
        });

        await server.connect(transport);

        await transport.handleRequest(req, res, req.body).then(() => {
          resolve(res);
        });
      } catch (error) {
        console.error("[HTTP-server] Error handling MCP request:", error);
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
    });
  });
}
