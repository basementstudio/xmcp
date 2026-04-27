import { Request, Response } from "express";
import { createServer } from "@/runtime/utils/server";
import { StatelessHttpServerTransport } from "@/runtime/transports/http/stateless-streamable-http";
import { setHeaders } from "@/runtime/transports/http/cors";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";

// cors config
const corsOrigin = HTTP_CORS_ORIGIN as string;
const corsMethods = HTTP_CORS_METHODS as string;
const corsAllowedHeaders = HTTP_CORS_ALLOWED_HEADERS as string;
const corsExposedHeaders = HTTP_CORS_EXPOSED_HEADERS as string;
const corsCredentials = HTTP_CORS_CREDENTIALS as boolean;
const corsMaxAge = HTTP_CORS_MAX_AGE as number;

const debug = HTTP_DEBUG as boolean;
const bodySizeLimit = HTTP_BODY_SIZE_LIMIT as string;

export async function xmcpHandler(req: Request, res: Response) {
  return new Promise((resolve) => {
    const id = randomUUID();
    const clientInfo = extractClientInfoFromMessages(req.body);

    httpRequestContextProvider(
      { id, headers: req.headers, clientInfo },
      async () => {
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
      }
    );
  });
}
