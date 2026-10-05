import { Request, Response } from "express";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createServer } from "@/runtime/utils/server";
import { setHeaders } from "@/runtime/transports/http/cors";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";
import type { CorsConfig } from "@/config";

const httpConfig = HTTP_CONFIG as {
  port: number;
  host: string;
  bodySizeLimit: number;
  endpoint: string;
  debug: boolean;
};
const corsConfig = HTTP_CORS_CONFIG as CorsConfig;

// A fresh McpServer is built per request; no state survives between requests.
// 2026-07-28 traffic is served natively, 2025-era traffic through the SDK's
// stateless fallback.
const mcpHandler = createMcpHandler(createServer, {
  legacy: "stateless",
  onerror: httpConfig.debug
    ? (error) => console.error("[HTTP-server] MCP handler error:", error)
    : undefined,
});
const nodeMcpHandler = toNodeHandler(mcpHandler, {
  onerror: (error) =>
    console.error("[HTTP-server] Error handling MCP request:", error),
});

export async function xmcpHandler(req: Request, res: Response) {
  const id = randomUUID();
  const clientInfo = extractClientInfoFromMessages(req.body);

  await httpRequestContextProvider(
    { id, headers: req.headers, clientInfo },
    async () => {
      setHeaders(res, corsConfig, req.headers.origin);

      // express.json() already consumed the stream; pass the parsed body.
      // req.auth (attached by auth middleware) is forwarded automatically.
      await nodeMcpHandler(req, res, req.body);
    }
  );
}
