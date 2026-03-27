import React, { useMemo, useRef } from "react";
import type { App as AppSchema } from "../schema/types.js";
import { StateProvider } from "./StateProvider.js";
import { ComponentRenderer } from "./ComponentRenderer.js";
import { ThemeProvider, useTheme, uiShellClassName } from "../react/theme.js";
import { cn } from "../react/utils.js";
import { RuntimeProvider } from "./RuntimeContext.js";

export interface AppProps {
  schema: AppSchema;
  className?: string;
}

function AppBody({
  schema,
  className,
}: AppProps) {
  const theme = useTheme();

  return (
    <div
      className={cn(uiShellClassName, "p-6", className)}
      style={theme.style}
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

export function App({ schema, className }: AppProps) {
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

    const sendRequest = async (method: string, params?: any): Promise<any> => {
      let res: Response;
      try {
        res = await fetch(mcpUrl, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            jsonrpc: "2.0",
            method,
            params: params ?? {},
            id: ++idRef.current,
          }),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to reach MCP endpoint "${mcpUrl}". Check widget CSP/connect domains and endpoint routing. Original error: ${message}`,
        );
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
      let json: any;
      if (text.trim().startsWith("{")) {
        json = JSON.parse(text);
      } else {
        // SSE format: extract data lines, find the one with our id
        const dataLines = text.split("\n").filter((l: string) => l.startsWith("data:"));
        for (const line of dataLines) {
          try {
            const parsed = JSON.parse(line.slice(5).trim());
            if (parsed.id || parsed.result || parsed.error) {
              json = parsed;
              break;
            }
          } catch {}
        }
        if (!json && dataLines.length > 0) {
          json = JSON.parse(dataLines[dataLines.length - 1].slice(5).trim());
        }
      }

      if (!json) throw new Error("Empty response from MCP server");
      if (json.error) throw new Error(json.error.message || "MCP request failed");
      return json.result;
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
      callTool: async (params: { name: string; arguments?: Record<string, unknown> }) => {
        await initialize();
        return sendRequest("tools/call", {
          name: params.name,
          arguments: params.arguments ?? {},
        });
      },
    };
  }, [schema.mcpServerUrl, schema.mcpHeaders]);

  return (
    <RuntimeProvider client={mcpClient}>
      <StateProvider initialState={schema.state}>
        <ThemeProvider
          mode={schema.theme === "light" ? "light" : "dark"}
          themeTokens={schema.themeTokens}
        >
          <AppBody schema={schema} className={className} />
        </ThemeProvider>
      </StateProvider>
    </RuntimeProvider>
  );
}

export default App;
