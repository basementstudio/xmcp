/**
 * Lightweight MCP Apps postMessage bridge for showcase demos.
 *
 * Uses the MCP Apps JSON-RPC protocol over window.parent.postMessage
 * to communicate with the host (Claude, ChatGPT, basic-host, etc.).
 *
 * The xmcp-generated HTML shell already handles ui/initialize,
 * so this hook only handles app-initiated requests.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ───────────────────────────────────────────────────────────

interface ToolResult {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
}

interface HostContext {
  theme?: string;
  displayMode?: string;
  styles?: Record<string, string>;
  safeAreaInsets?: { top: number; right: number; bottom: number; left: number };
  [key: string]: unknown;
}

interface McpBridge {
  /** Call a tool on the MCP server via the host */
  callTool: (name: string, args?: Record<string, unknown>) => Promise<ToolResult>;
  /** Request a display mode change (inline/fullscreen) */
  requestDisplayMode: (mode: "inline" | "fullscreen") => Promise<{ mode: string }>;
  /** Open a link via the host */
  openLink: (url: string) => Promise<void>;
  /** Whether we're running inside a compatible host */
  isConnected: boolean;
  /** Host context from initialization or updates */
  hostContext: HostContext | null;
}

// ── Hook ────────────────────────────────────────────────────────────

export function useMcpBridge(): McpBridge {
  const nextIdRef = useRef(100); // start high to avoid collision with init handshake
  const pendingRef = useRef<
    Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>
  >(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [hostContext, setHostContext] = useState<HostContext | null>(null);

  // Listen for responses and notifications from the host
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;

      // Response to a request we sent
      if ("id" in data && data.id != null) {
        const pending = pendingRef.current.get(data.id);
        if (pending) {
          pendingRef.current.delete(data.id);
          if (data.error) {
            pending.reject(new Error(data.error.message ?? "MCP request failed"));
          } else {
            pending.resolve(data.result);
          }
        }
      }

      // Host context from init response (id=1 from the xmcp shell)
      if (data?.result?.hostContext && data?.id === 1) {
        setIsConnected(true);
        setHostContext(data.result.hostContext);
      }

      // Host context changed notification
      if (data?.method === "ui/hostContextChanged" && data?.params?.hostContext) {
        setHostContext(data.params.hostContext);
      }

      // Tool result pushed by host
      if (data?.method === "ui/toolResult" || data?.method === "ui/tool/result") {
        // Could dispatch to subscribers — for now just captured via callTool response
      }
    }

    window.addEventListener("message", handleMessage);

    // Check if we're in an iframe (likely in a host)
    const inIframe = window.parent !== window;
    if (!inIframe) {
      // Not in iframe — standalone mode
      setIsConnected(false);
    } else {
      // Give the host 2 seconds to respond to the init handshake
      const timeout = setTimeout(() => {
        if (!hostContext) {
          setIsConnected(false);
        }
      }, 2000);
      // Assume connected if in iframe (xmcp shell already did init)
      setIsConnected(true);
      return () => {
        clearTimeout(timeout);
        window.removeEventListener("message", handleMessage);
      };
    }

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const sendRequest = useCallback(
    (method: string, params: Record<string, unknown> = {}): Promise<any> => {
      return new Promise((resolve, reject) => {
        const id = nextIdRef.current++;
        pendingRef.current.set(id, { resolve, reject });

        window.parent.postMessage(
          {
            jsonrpc: "2.0",
            id,
            method,
            params,
          },
          "*"
        );

        // Timeout after 15s
        setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            reject(new Error(`MCP request timed out: ${method}`));
          }
        }, 15000);
      });
    },
    []
  );

  const callTool = useCallback(
    (name: string, args?: Record<string, unknown>): Promise<ToolResult> => {
      return sendRequest("tools/call", { name, arguments: args ?? {} });
    },
    [sendRequest]
  );

  const requestDisplayMode = useCallback(
    (mode: "inline" | "fullscreen"): Promise<{ mode: string }> => {
      return sendRequest("ui/requestDisplayMode", { mode });
    },
    [sendRequest]
  );

  const openLink = useCallback(
    async (url: string): Promise<void> => {
      try {
        await sendRequest("ui/openLink", { url });
      } catch {
        // Fallback: open directly if host doesn't support it
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [sendRequest]
  );

  return { callTool, requestDisplayMode, openLink, isConnected, hostContext };
}

/**
 * Extract text content from a tool result
 */
export function extractToolText(result: ToolResult): string | undefined {
  if (result.structuredContent) {
    return JSON.stringify(result.structuredContent);
  }
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text" && item.text) {
        return item.text;
      }
    }
  }
  return undefined;
}

/**
 * Parse a tool result — prefers structuredContent (no parsing needed),
 * falls back to parsing text content as JSON.
 */
export function parseToolResult<T = unknown>(result: ToolResult): T | null {
  if (result.structuredContent != null) {
    return result.structuredContent as T;
  }
  const text = extractToolText(result);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
