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

const packageJson = require("../../package.json");

// Client identity for MCP connections
export const CLIENT_IDENTITY = {
  name: packageJson.name,
  version: packageJson.version,
};

interface HttpClientOptions {
  /** Full MCP server base URL — example: https://host.tld/mcp */
  url: string;
}

/**
 * Pure direct HTTP MCP client (no proxy, no SSE, no stdio)
 */
export async function createHTTPClient({
  url,
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

  // ----- Auth -----
  // skip for now
  /*
  const authProvider = new InspectorOAuthClientProvider(url);
  const oauthToken = (await authProvider.tokens())?.access_token;

  const headers: Record<string, string> = {};

  // Inject OAuth only if no Authorization header is supplied manually
  const needsOAuth = !customHeaders.some(
    (h) => h.enabled && h.name.toLowerCase() === "authorization"
  );
  if (needsOAuth && oauthToken) {
    headers["Authorization"] = `Bearer ${oauthToken}`;
  }

  // Merge enabled custom headers
  customHeaders.forEach((h) => {
    if (h.enabled && h.name && h.value) {
      headers[h.name.trim()] = h.value.trim();
    }
  });
  */

  // ----- Build URL -----
  const serverUrl = new URL(url);

  // ----- Construct HTTP transport -----
  const transportOptions: StreamableHTTPClientTransportOptions = {
    //requestInit: { headers },
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
