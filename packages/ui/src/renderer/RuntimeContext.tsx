import React, { createContext, useContext } from "react";
import type {
  McpHostCallToolParams,
  McpHostCapabilities,
  McpHostContext,
  McpHostMessageResult,
  McpHostModelContextResult,
  McpHostReadResourceResult,
  McpHostRequestDisplayModeResult,
  McpHostSendMessageParams,
  McpHostToolResult,
  McpUiDisplayMode,
  McpHostUpdateModelContextParams,
  McpHostContainerDimensions,
} from "xmcp/host-bridge";

export interface McpClient {
  callTool: (params: McpHostCallToolParams) => Promise<McpHostToolResult>;
  openLink?: (url: string) => Promise<void>;
  requestDisplayMode?: (
    mode: McpUiDisplayMode
  ) => Promise<McpHostRequestDisplayModeResult>;
  readResource?: (uri: string) => Promise<McpHostReadResourceResult>;
  sendMessage?: (params: McpHostSendMessageParams) => Promise<McpHostMessageResult>;
  updateModelContext?: (
    params: McpHostUpdateModelContextParams
  ) => Promise<McpHostModelContextResult>;
  notifySizeChanged?: (params: McpHostContainerDimensions) => Promise<void>;
  hostContext?: McpHostContext | null;
  hostCapabilities?: McpHostCapabilities | null;
  isConnected?: boolean;
}

const RuntimeClientContext = createContext<McpClient | null>(null);

export interface RuntimeProviderProps {
  client: McpClient;
  children: React.ReactNode;
}

export function RuntimeProvider({
  client,
  children,
}: RuntimeProviderProps) {
  return (
    <RuntimeClientContext.Provider value={client}>
      {children}
    </RuntimeClientContext.Provider>
  );
}

export function useRendererClient(): McpClient {
  const client = useContext(RuntimeClientContext);
  if (!client) {
    throw new Error("useRendererClient must be used within a <RuntimeProvider>");
  }
  return client;
}
