import React, { useMemo } from "react";
import type { App as AppSchema } from "../schema/types.js";
import type {
  McpHostCallToolParams,
  McpHostToolResult,
} from "xmcp/host-bridge";
import { StateProvider } from "./StateProvider.js";
import { ComponentRenderer } from "./ComponentRenderer.js";
import { ThemeProvider, useTheme, uiShellClassName } from "../react/theme.js";
import { cn } from "../react/utils.js";
import { RuntimeProvider } from "./RuntimeContext.js";
import { useMcpApp } from "./use-mcp-app.js";

export interface AppProps {
  schema: AppSchema;
  className?: string;
  inheritTheme?: boolean;
  transportMode?: "http" | "host" | "auto";
}

const MCP_PROTOCOL_VERSION = "2025-11-25";
const MCP_CLIENT_NAME = "xmcp-ui";
const MCP_CLIENT_VERSION = "0.1.0";
const MCP_REQUEST_TIMEOUT_MS = 30_000;

interface HttpMcpClientOptions {
  serverUrl: string;
  headers?: AppSchema["mcpHeaders"];
}

function parseMcpResponse<T>(text: string, requestId: number): T {
  let response: Record<string, unknown> | undefined;

  if (text.trim().startsWith("{")) {
    response = JSON.parse(text) as Record<string, unknown>;
  } else {
    const dataLines = text
      .split("\n")
      .filter((line) => line.startsWith("data:"));

    for (const line of dataLines) {
      try {
        const candidate = JSON.parse(line.slice(5).trim()) as Record<
          string,
          unknown
        >;
        if (candidate.id === requestId) {
          response = candidate;
          break;
        }
      } catch {
        // Ignore non-JSON SSE frames and continue looking for this request id.
      }
    }
  }

  if (!response) {
    const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text;
    throw new Error(`No matching MCP response found. Raw: ${preview}`);
  }

  if (response.error) {
    const error = response.error as Record<string, unknown>;
    throw new Error(
      typeof error.message === "string" ? error.message : "MCP request failed"
    );
  }

  return response.result as T;
}

export function createHttpMcpClient({
  serverUrl,
  headers: configuredHeaders,
}: HttpMcpClientOptions) {
  const baseUrl = serverUrl.replace(/\/+$/, "");
  const mcpUrl = baseUrl.endsWith("/mcp") ? baseUrl : `${baseUrl}/mcp`;
  let nextRequestId = 0;
  let sessionId: string | null = null;
  let initialized = false;

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (sessionId) {
      headers["mcp-session-id"] = sessionId;
    }
    for (const header of configuredHeaders ?? []) {
      headers[header.name] = header.value;
    }
    return headers;
  };

  const sendRequest = async <T,>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T> => {
    const requestId = ++nextRequestId;
    let response: Response;

    try {
      response = await fetch(mcpUrl, {
        method: "POST",
        headers: getHeaders(),
        signal: AbortSignal.timeout(MCP_REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params: params ?? {},
          id: requestId,
        }),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(
          `MCP request timed out after ${MCP_REQUEST_TIMEOUT_MS / 1_000}s`
        );
      }
      if (error instanceof TypeError) {
        throw new Error("Failed to reach MCP endpoint");
      }
      throw new Error(error instanceof Error ? error.message : String(error));
    }

    const returnedSessionId = response.headers.get("mcp-session-id");
    if (returnedSessionId) {
      sessionId = returnedSessionId;
    }

    const text = await response.text();
    if (!response.ok) {
      const preview = text.length > 300 ? `${text.slice(0, 300)}...` : text;
      throw new Error(
        `MCP endpoint "${mcpUrl}" returned HTTP ${response.status}. ${preview}`
      );
    }

    return parseMcpResponse<T>(text, requestId);
  };

  const initialize = async () => {
    if (initialized) return;

    await sendRequest("initialize", {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: MCP_CLIENT_NAME, version: MCP_CLIENT_VERSION },
    });

    try {
      await fetch(mcpUrl, {
        method: "POST",
        headers: getHeaders(),
        signal: AbortSignal.timeout(MCP_REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }),
      });
    } catch {
      // Stateless servers may reject or close notification requests.
    }

    initialized = true;
  };

  return {
    callTool: async (params: McpHostCallToolParams) => {
      await initialize();
      return sendRequest<McpHostToolResult>("tools/call", {
        name: params.name,
        arguments: params.arguments ?? {},
      });
    },
  };
}

function AppBody({ schema, className, inheritTheme = false }: AppProps) {
  const theme = useTheme();

  return (
    <div
      className={cn(uiShellClassName, "p-6", className)}
      style={inheritTheme ? undefined : theme.style}
    >
      {schema.title && (
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          {schema.title}
        </h1>
      )}
      <ComponentRenderer node={schema.root} />
    </div>
  );
}

export function App({
  schema,
  className,
  inheritTheme = false,
  transportMode = "auto",
}: AppProps) {
  const mcpApp = useMcpApp();

  const mcpClient = useMemo(
    () =>
      createHttpMcpClient({
        serverUrl: schema.mcpServerUrl,
        headers: schema.mcpHeaders,
      }),
    [schema.mcpHeaders, schema.mcpServerUrl]
  );

  const hostClient = useMemo(
    () => ({
      callTool: async (params: McpHostCallToolParams) => {
        return mcpApp.callTool(params.name, params.arguments);
      },
      openLink: mcpApp.openLink,
      requestDisplayMode: mcpApp.requestDisplayMode,
      readResource: mcpApp.readResource,
      sendMessage: mcpApp.sendMessage,
      updateModelContext: mcpApp.updateModelContext,
      notifySizeChanged: mcpApp.notifySizeChanged,
      hostContext: mcpApp.hostContext,
      hostCapabilities: mcpApp.hostCapabilities,
      isConnected: mcpApp.isConnected,
    }),
    [mcpApp]
  );

  const runtimeClient = useMemo(() => {
    if (transportMode === "host") {
      return hostClient;
    }
    if (transportMode === "auto" && mcpApp.isConnected) {
      return hostClient;
    }
    return {
      ...mcpClient,
      openLink: mcpApp.openLink,
      requestDisplayMode: mcpApp.requestDisplayMode,
      readResource: mcpApp.readResource,
      sendMessage: mcpApp.sendMessage,
      updateModelContext: mcpApp.updateModelContext,
      notifySizeChanged: mcpApp.notifySizeChanged,
      hostContext: mcpApp.hostContext,
      hostCapabilities: mcpApp.hostCapabilities,
      isConnected: mcpApp.isConnected,
    };
  }, [hostClient, mcpApp, mcpClient, transportMode]);

  return (
    <RuntimeProvider client={runtimeClient}>
      <StateProvider initialState={schema.state}>
        {inheritTheme ? (
          <AppBody
            schema={schema}
            className={className}
            inheritTheme={inheritTheme}
          />
        ) : (
          <ThemeProvider
            mode={schema.theme === "light" ? "light" : "dark"}
            themeTokens={schema.themeTokens}
          >
            <AppBody schema={schema} className={className} />
          </ThemeProvider>
        )}
      </StateProvider>
    </RuntimeProvider>
  );
}

export default App;
