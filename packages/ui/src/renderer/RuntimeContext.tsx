import React, { createContext, useContext } from "react";

export interface McpClient {
  callTool: (params: {
    name: string;
    arguments?: Record<string, unknown>;
  }) => Promise<{ content: unknown }>;
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
