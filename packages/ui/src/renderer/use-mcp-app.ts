import { useEffect, useRef, useState, type RefObject } from "react";
import {
  createMcpHostBridge,
  type McpHostCallToolParams,
  type McpHostBridge,
  type McpHostBridgeState,
  type McpHostCapabilities,
  type McpHostContainerDimensions,
  type McpHostContext,
  type McpHostMessageResult,
  type McpHostModelContextResult,
  type McpHostRequestDisplayModeResult,
  type McpHostReadResourceResult,
  type McpHostSendMessageParams,
  type McpHostToolResult,
  type McpUiDisplayMode,
  type McpHostUpdateModelContextParams,
} from "xmcp/host-bridge";

export interface UseMcpHostBridgeResult {
  callTool: (
    name: McpHostCallToolParams["name"],
    args?: McpHostCallToolParams["arguments"]
  ) => Promise<McpHostToolResult>;
  requestDisplayMode: (
    mode: McpUiDisplayMode
  ) => Promise<McpHostRequestDisplayModeResult>;
  openLink: (url: string) => Promise<void>;
  readResource: (uri: string) => Promise<McpHostReadResourceResult>;
  sendMessage: (
    params: McpHostSendMessageParams
  ) => Promise<McpHostMessageResult>;
  updateModelContext: (
    params: McpHostUpdateModelContextParams
  ) => Promise<McpHostModelContextResult>;
  logMessage: (params: McpHostSendMessageParams) => Promise<void>;
  notifySizeChanged: (params: McpHostContainerDimensions) => Promise<void>;
  isConnected: boolean;
  hostContext: McpHostContext | null;
  hostCapabilities: McpHostCapabilities | null;
}

export function useMcpHostBridge(): UseMcpHostBridgeResult {
  const bridgeRef = useRef<McpHostBridge | null>(null);

  if (!bridgeRef.current) {
    bridgeRef.current = createMcpHostBridge();
  }

  const bridge = bridgeRef.current;
  const [state, setState] = useState(() => bridge.getState());

  useEffect(() => {
    const unsubscribe = bridge.subscribe((nextState: McpHostBridgeState) => {
      setState(nextState);
    });

    return () => {
      unsubscribe();
      bridge.dispose();
      bridgeRef.current = null;
    };
  }, [bridge]);

  return {
    callTool: bridge.callTool,
    requestDisplayMode: bridge.requestDisplayMode,
    openLink: bridge.openLink,
    readResource: bridge.readResource,
    sendMessage: bridge.sendMessage,
    updateModelContext: bridge.updateModelContext,
    logMessage: bridge.logMessage,
    notifySizeChanged: bridge.notifySizeChanged,
    isConnected: state.isConnected,
    hostContext: state.hostContext,
    hostCapabilities: state.hostCapabilities,
  };
}

export type UseMcpAppResult = UseMcpHostBridgeResult;

export function useMcpApp(): UseMcpAppResult {
  return useMcpHostBridge();
}

export function useAutoMcpAppSize(elementRef: RefObject<Element | null>) {
  const { isConnected, notifySizeChanged } = useMcpApp();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isConnected || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      void notifySizeChanged({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, isConnected, notifySizeChanged]);
}
