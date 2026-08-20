import type { FastifyRequest, FastifyReply } from "fastify";
import { createServer } from "@/runtime/utils/server";
import { StatelessHttpServerTransport } from "@/runtime/transports/http/stateless-streamable-http";
import { setHeaders } from "@/runtime/transports/http/cors";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";
import type { CorsConfig } from "@/compiler/config";

const httpConfig = HTTP_CONFIG as {
  port: number;
  host: string;
  bodySizeLimit: number;
  endpoint: string;
  debug: boolean;
};
const corsConfig = HTTP_CORS_CONFIG as CorsConfig;

export async function xmcpHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return new Promise<void>((resolve) => {
    const id = randomUUID();
    const clientInfo = extractClientInfoFromMessages(request.body);

    httpRequestContextProvider(
      { id, headers: request.headers, clientInfo },
      async () => {
        try {
          // Claim the raw stream before any await so Fastify never attempts its
          // own finalisation after the transport has already written to reply.raw.
          // This MUST remain the first statement in the try block — after hijack,
          // any throw is caught here and written directly to reply.raw, with no
          // risk of Fastify also sending a response.
          reply.hijack();

          setHeaders(reply.raw, corsConfig, request.headers.origin);

          const server = await createServer();
          const transport = new StatelessHttpServerTransport(
            httpConfig.debug,
            httpConfig.bodySizeLimit.toString()
          );

          // Release transport + server when the connection closes (normal
          // completion or client abort). Without this, warm containers leak
          // instances per request.
          reply.raw.on("close", () => {
            transport.close();
            server.close();
          });

          await server.connect(transport);

          // The transport writes directly to reply.raw via Node's ServerResponse
          // API. request.raw has already had its body consumed by Fastify, so
          // we pass request.body as parsedBody rather than re-reading the stream.
          await transport.handleRequest(request.raw, reply.raw, request.body);
          resolve();
        } catch (error) {
          console.error("[HTTP-server] Error handling MCP request:", error);
          if (!reply.raw.headersSent) {
            reply.raw.writeHead(500, { "content-type": "application/json" });
            reply.raw.end(
              JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32603, message: "Internal server error" },
                id: null,
              })
            );
          }
          resolve();
        }
      }
    );
  });
}
