import { type AuthInfo, createMcpHandler } from "@modelcontextprotocol/server";

import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";
import { createServer } from "@/runtime/utils/server";

export interface XmcpHandlerOptions {
  authInfo?: AuthInfo;
}

// The SDK creates a fresh server for each request, including legacy clients.
const handler = createMcpHandler(createServer, {
  legacy: "stateless",
  maxSubscriptions: HTTP_CONFIG.maxSubscriptions,
});

/** Handle a host framework's Web Request without owning its server. */
export async function xmcpHandler(
  request: Request,
  options: XmcpHandlerOptions = {}
): Promise<Response> {
  // Keep the original body readable so the SDK can report malformed JSON.
  const parsedBody =
    request.method === "POST"
      ? await request
          .clone()
          .json()
          .catch(() => undefined)
      : undefined;

  return httpRequestContextProvider(
    {
      id: crypto.randomUUID(),
      headers: Object.fromEntries(request.headers.entries()),
      clientInfo: extractClientInfoFromMessages(parsedBody),
    },
    () => handler.fetch(request, { parsedBody, authInfo: options.authInfo })
  );
}
