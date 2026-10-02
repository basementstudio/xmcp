import { createMcpHandler, type AuthInfo } from "@modelcontextprotocol/server";
import { createServer } from "@/runtime/utils/server";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";

export interface XmcpHandlerOptions {
  authInfo?: AuthInfo;
}

// The SDK creates a fresh server for each request, including legacy clients.
const handler = createMcpHandler(createServer, { legacy: "stateless" });

/** Handle a TanStack Start server route's Web Request. */
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
