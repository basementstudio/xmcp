import {
  Client,
  SdkHttpError,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import type {
  McpHostCallToolParams,
  McpHostToolResult,
} from "xmcp/host-bridge";
import type { App as AppSchema } from "../schema/types.js";

// Bound connect, tool calls, and session disposal so a stalled server cannot
// leave the UI waiting indefinitely. Request timing is owned by the SDK.
export const MCP_REQUEST_TIMEOUT_MS = 30_000;

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const RESERVED_MCP_HEADERS = new Set([
  "accept",
  "connection",
  "content-length",
  "content-type",
  "cookie",
  "host",
  "mcp-session-id",
  "origin",
  "referer",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
]);

function isForbiddenHeaderName(name: string): boolean {
  const normalizedName = name.toLowerCase();
  return (
    RESERVED_MCP_HEADERS.has(normalizedName) ||
    normalizedName.startsWith("mcp-") ||
    normalizedName.startsWith("proxy-") ||
    normalizedName.startsWith("sec-")
  );
}

export function sanitizeMcpHeaders(
  headers: AppSchema["mcpHeaders"]
): NonNullable<AppSchema["mcpHeaders"]> {
  return (headers ?? []).filter(
    ({ name, value }) =>
      HTTP_HEADER_NAME_PATTERN.test(name) &&
      !isForbiddenHeaderName(name) &&
      !/[\0\r\n]/.test(value)
  );
}

export function createHttpMcpClient({
  serverUrl,
  headers,
}: {
  serverUrl: string;
  headers?: AppSchema["mcpHeaders"];
}) {
  const endpoint = new URL(serverUrl);
  if (
    !["http:", "https:"].includes(endpoint.protocol) ||
    endpoint.username ||
    endpoint.password
  ) {
    throw new Error(
      "The MCP server URL must use HTTP(S) without embedded credentials."
    );
  }
  endpoint.pathname = endpoint.pathname.replace(/\/+$/, "");
  if (!endpoint.pathname.endsWith("/mcp")) endpoint.pathname += "/mcp";
  endpoint.hash = "";
  const requestHeaders = Object.fromEntries(
    sanitizeMcpHeaders(headers).map(({ name, value }) => [name, value])
  );
  let connection:
    | {
        client: Client;
        transport: StreamableHTTPClientTransport;
        ready: Promise<void>;
      }
    | undefined;

  function connect() {
    if (connection) return connection;
    const client = new Client(
      { name: "xmcp-ui", version: "0.1.0" },
      {
        capabilities: {},
        versionNegotiation: { mode: "auto" },
      }
    );
    const transport = new StreamableHTTPClientTransport(endpoint, {
      requestInit: { headers: requestHeaders, redirect: "error" },
      // DELETE has no JSON-RPC request timeout; bound only that cleanup request.
      fetch: (url, init) =>
        fetch(
          url,
          init?.method === "DELETE"
            ? {
                ...init,
                signal: AbortSignal.any([
                  ...(init.signal ? [init.signal] : []),
                  AbortSignal.timeout(MCP_REQUEST_TIMEOUT_MS),
                ]),
              }
            : init
        ),
    });
    const current = { client, transport, ready: Promise.resolve() };
    connection = current;
    client.onclose = () => {
      if (connection === current) connection = undefined;
    };
    current.ready = client
      .connect(transport, { timeout: MCP_REQUEST_TIMEOUT_MS })
      .catch(async (error) => {
        if (connection === current) connection = undefined;
        await client.close();
        throw error;
      });
    return current;
  }

  return {
    async callTool(params: McpHostCallToolParams): Promise<McpHostToolResult> {
      const current = connect();
      await current.ready;
      try {
        return await current.client.callTool(
          { name: params.name, arguments: params.arguments ?? {} },
          { timeout: MCP_REQUEST_TIMEOUT_MS }
        );
      } catch (error) {
        if (
          error instanceof SdkHttpError &&
          error.status === 404 &&
          current.transport.sessionId
        ) {
          // Expired sessions reconnect on the NEXT user action. Never replay a
          // tool call automatically: the first attempt may have caused effects.
          if (connection === current) connection = undefined;
          await current.client.close();
        }
        throw error;
      }
    },
    async close() {
      const current = connection;
      connection = undefined;
      if (!current) return;
      try {
        await current.transport.terminateSession();
      } finally {
        await current.client.close();
      }
    },
  };
}
