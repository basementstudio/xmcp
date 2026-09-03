/**
 * Vercel build entry.
 *
 * Vercel serves the built file as a function, so it has to export a request
 * handler and must not listen on a port of its own. A listening socket keeps
 * the instance's event loop alive: the invocation that booted the server never
 * settles, and it is killed once the function's maximum duration is reached,
 * even though the response itself was already sent.
 *
 * The transport's Express app is a request listener, so the platform owns the
 * server and this entry only hands the listener over.
 */
import type { IncomingMessage, ServerResponse } from "http";
import { StatelessStreamableHTTPTransport } from "@/runtime/transports/http/stateless-streamable-http";
import { createHttpTransport } from "@/runtime/transports/http/create-transport";

// Built once per instance and reused across invocations. Each request is still
// handled statelessly by the transport: nothing about a request survives it.
let transport: Promise<StatelessStreamableHTTPTransport> | undefined;

function getTransport(): Promise<StatelessStreamableHTTPTransport> {
  if (!transport) {
    // A build that fails (a middleware module that throws, say) is reported to
    // the request that awaited it and then dropped, so the next invocation on
    // this instance builds again rather than replaying the same rejection for
    // the rest of the instance's life. The rejection is attached here as well,
    // because a request that arrives while the build is still running would
    // otherwise leave it unhandled.
    transport = createHttpTransport();
    transport.catch((error) => {
      console.error("[HTTP-server] Error building the MCP server:", error);
      transport = undefined;
    });
  }

  return transport;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const { requestListener } = await getTransport();

  requestListener(req, res);
}
