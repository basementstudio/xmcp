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
import { createHttpTransport } from "@/runtime/transports/http/create-transport";

// Built once per instance and reused across invocations. Each request is still
// handled statelessly by the transport: nothing about a request survives it.
const transport = createHttpTransport();

// A failed build (a middleware module that throws, say) is reported to the
// request that awaits it below; this keeps it from surfacing as an unhandled
// rejection at import time instead, which would take the instance down before
// it could answer anything.
transport.catch(() => {});

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const { requestListener } = await transport;

  requestListener(req, res);
}
