import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport,
  type StdioServerParameters,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  StreamableHTTPClientTransport,
  StreamableHTTPClientTransportOptions,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  Request,
  Result,
  Notification,
} from "@modelcontextprotocol/sdk/types.js";
import type { Buffer } from "node:buffer";
import { CustomHeaders, headersToRecord } from "./headers";

const packageJson = require("../../package.json");

// Client identity for MCP connections
export const CLIENT_IDENTITY = {
  name: packageJson.name,
  version: packageJson.version,
};

const CLIENT_CAPABILITIES = {
  capabilities: {
    sampling: {},
    elicitation: {},
    roots: { listChanged: true },
  },
} as const;

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
  const client = new Client<Request, Notification, Result>(
    CLIENT_IDENTITY,
    CLIENT_CAPABILITIES
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

export interface StdioClientOptions extends StdioServerParameters {
  /**
   * Optional hook that receives stderr chunks when the transport
   * runs with piped stderr (defaults to logging to console.error).
   */
  onStderrData?: (chunk: Buffer) => void;
}

export interface StdioClientConnection {
  client: Client<Request, Notification, Result>;
  transport: StdioClientTransport;
}

/**
 * Spawn and connect to an MCP server via stdio transport.
 */
export async function createSTDIOClient(
  options: StdioClientOptions
): Promise<StdioClientConnection> {
  const { onStderrData, ...serverParams } = options;

  const client = new Client<Request, Notification, Result>(
    CLIENT_IDENTITY,
    CLIENT_CAPABILITIES
  );

  const transport = new StdioClientTransport({
    ...serverParams,
    stderr: serverParams.stderr ?? "pipe",
  });

  const stderrStream = transport.stderr;
  if (stderrStream) {
    const stderrHandler =
      onStderrData ??
      ((data: Buffer) => {
        console.error(`[STDIO MCP Server stderr]: ${data}`);
      });
    stderrStream.on("data", stderrHandler);
  }

  await client.connect(transport);

  return {
    client,
    transport,
  };
}

/**
 * Convenience helper to list available tools on a stdio MCP server.
 */
export async function listSTDIOClientTools(
  connection: StdioClientConnection
): Promise<string[]> {
  try {
    const result = await connection.client.listTools();
    return result.tools.map((tool) => tool.name);
  } catch (error) {
    console.error("Failed to list stdio MCP tools:", error);
    return [];
  }
}

/**
 * Invoke a tool exposed by the connected stdio MCP server.
 */
export async function callSTDIOClientTool(
  connection: StdioClientConnection,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  try {
    return await connection.client.callTool({
      name: toolName,
      arguments: args,
    });
  } catch (error) {
    console.error(`Failed to call stdio MCP tool "${toolName}":`, error);
    throw error;
  }
}

/**
 * Disconnect the stdio transport and close the client.
 */
export async function disconnectSTDIOClient(
  connection: StdioClientConnection
): Promise<void> {
  try {
    await connection.transport.close();
    await connection.client.close();
  } catch (error) {
    console.error("Error disconnecting from stdio MCP server:", error);
    throw error;
  }
}
