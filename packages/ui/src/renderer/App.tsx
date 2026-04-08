import React, { useMemo, useRef } from "react";
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
import { useMcpApp } from "./use-mcp-host-bridge.js";

export interface AppProps {
  schema: AppSchema;
  className?: string;
  inheritTheme?: boolean;
  transportMode?: "http" | "host" | "auto";
}

function AppBody({
  schema,
  className,
  inheritTheme = false,
}: AppProps) {
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
  transportMode = "http",
}: AppProps) {
  const mcpApp = useMcpApp();
  const idRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const mcpClient = useMemo(() => {
    // Ensure URL ends with /mcp
    const baseUrl = schema.mcpServerUrl.replace(/\/+$/, "");
    const mcpUrl = baseUrl.endsWith("/mcp") ? baseUrl : `${baseUrl}/mcp`;

    const getHeaders = (): Record<string, string> => {
      const h: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      };
      if (sessionIdRef.current) {
        h["mcp-session-id"] = sessionIdRef.current;
      }
      if (schema.mcpHeaders) {
        for (const header of schema.mcpHeaders) {
          h[header.name] = header.value;
        }
      }
      return h;
    };

    const sendRequest = async <T,>(
      method: string,
      params?: Record<string, unknown>
    ): Promise<T> => {
      let res: Response;
      try {
        res = await fetch(mcpUrl, {
          method: "POST",
          headers: getHeaders(),
          signal: AbortSignal.timeout(30_000),
          body: JSON.stringify({
            jsonrpc: "2.0",
            method,
            params: params ?? {},
            id: ++idRef.current,
          }),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("MCP request timed out after 30s");
        }
        if (error instanceof TypeError) {
          throw new Error("Failed to reach MCP endpoint");
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(message);
      }

      // Capture session ID from response headers
      const sid = res.headers.get("mcp-session-id");
      if (sid) sessionIdRef.current = sid;

      const text = await res.text();
      if (!res.ok) {
        const preview = text.length > 300 ? `${text.slice(0, 300)}...` : text;
        throw new Error(
          `MCP endpoint "${mcpUrl}" returned HTTP ${res.status}. ${preview}`,
        );
      }
      // Parse SSE or JSON response
      let json: Record<string, unknown> | undefined;
      if (text.trim().startsWith("{")) {
        json = JSON.parse(text) as Record<string, unknown>;
      } else {
        // SSE format: extract data lines, find the one with our id
        const dataLines = text.split("\n").filter((l: string) => l.startsWith("data:"));
        for (const line of dataLines) {
          try {
            const parsed = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
            if (parsed.id || parsed.result || parsed.error) {
              json = parsed;
              break;
            }
          } catch {}
        }
        if (!json) {
          const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text;
          throw new Error(`No valid MCP response found in SSE stream. Raw: ${preview}`);
        }
      }

      if (!json) throw new Error("Empty response from MCP server");
      if (json.error) {
        const err = json.error as Record<string, unknown>;
        throw new Error((err.message as string) || "MCP request failed");
      }
      return json.result as T;
    };

    const initialize = async () => {
      if (initializedRef.current) return;
      await sendRequest("initialize", {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "xmcp-ui", version: "0.0.1" },
      });
      // Send initialized notification (no id = notification)
      await fetch(mcpUrl, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }),
      });
      initializedRef.current = true;
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
  }, [schema.mcpServerUrl, schema.mcpHeaders]);

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
