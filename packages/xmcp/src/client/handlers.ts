import type {
  Client,
  ClientCapabilities,
  ClientContext,
  HandlerResultTypeMap,
  RequestTypeMap,
} from "@modelcontextprotocol/client";

type Handler<Method extends keyof RequestTypeMap> = (
  request: RequestTypeMap[Method],
  context: ClientContext
) => HandlerResultTypeMap[Method] | Promise<HandlerResultTypeMap[Method]>;

export interface ClientHandlers {
  sampling?: Handler<"sampling/createMessage">;
  /** Handles both form and URL elicitation requests. */
  elicitation?: Handler<"elicitation/create">;
  roots?: Handler<"roots/list">;
}

/**
 * Advertise only what the client can serve: servers use these capabilities to
 * decide which requests (and multi round-trip inputs) to send.
 */
export function capabilitiesForHandlers(
  handlers: ClientHandlers
): ClientCapabilities {
  const capabilities: ClientCapabilities = {};
  if (handlers.sampling) capabilities.sampling = {};
  if (handlers.elicitation) capabilities.elicitation = { form: {}, url: {} };
  if (handlers.roots) capabilities.roots = {};
  return capabilities;
}

/** Install handlers before connecting so they are ready during negotiation. */
export function registerClientHandlers(
  client: Client,
  handlers: ClientHandlers
): void {
  if (handlers.sampling)
    client.setRequestHandler("sampling/createMessage", handlers.sampling);
  if (handlers.elicitation)
    client.setRequestHandler("elicitation/create", handlers.elicitation);
  if (handlers.roots) client.setRequestHandler("roots/list", handlers.roots);
}
