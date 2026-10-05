import type { FastifyRequest, FastifyReply } from "fastify";
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

export async function xmcpHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const id = randomUUID();
  const clientInfo = extractClientInfoFromMessages(request.body);

  return httpRequestContextProvider(
    { id, headers: request.headers, clientInfo },
    async () => {
      // Claim the raw stream before any await so Fastify never attempts its
      // own finalisation after the handler has already written to reply.raw.
      reply.hijack();

      setHeaders(reply.raw, corsConfig, request.headers.origin);

      // Fastify already consumed the body stream, so request.body goes
      // through as the pre-parsed body. The handler writes directly to
      // reply.raw and answers 500 itself if request handling throws.
      await nodeMcpHandler(request.raw, reply.raw, request.body);
    }
  );
}
