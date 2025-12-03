import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StreamableHTTPClientTransport,
  StreamableHTTPClientTransportOptions,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  Request,
  Result,
  Notification,
} from "@modelcontextprotocol/sdk/types.js";
import { CustomHeaders, headersToRecord } from "./headers";

const packageJson = require("../../package.json");

// Client identity for MCP connections
export const CLIENT_IDENTITY = {
  name: packageJson.name,
  version: packageJson.version,
};

interface HttpClientOptions {
  /** Full MCP server base URL — example: https://host.tld/mcp */
  url: string;
  headers?: CustomHeaders;
}

/**
 * Pure direct HTTP MCP client (no proxy, no SSE, no stdio)
 */
export async function createHTTPClient({
  url,
  headers,
}: HttpClientOptions): Promise<Client<Request, Notification, Result>> {
  const clientCapabilities = {
    capabilities: {
      sampling: {},
      elicitation: {},
      roots: { listChanged: true },
    },
  };

  const client = new Client<Request, Notification, Result>(
    CLIENT_IDENTITY,
    clientCapabilities
  );

  // ----- headers -----
  const headersRecord = headers
    ? headersToRecord(headers)
    : ({} as Record<string, string>);

  // ----- Build URL -----
  const serverUrl = new URL(url);

  // ----- Construct HTTP transport -----
  const transportOptions: StreamableHTTPClientTransportOptions = {
    ...(headers ? { requestInit: { headers: headersRecord } } : {}),
    reconnectionOptions: {
      maxReconnectionDelay: 30000,
      initialReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.5,
      maxRetries: 2,
    },
  };

  const transport = new StreamableHTTPClientTransport(
    serverUrl,
    transportOptions
  );

  await client.connect(transport);

  return client;
}
