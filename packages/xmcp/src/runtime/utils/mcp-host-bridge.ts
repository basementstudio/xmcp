import {
  HOST_CONTEXT_CHANGED_METHOD,
  HOST_CONTEXT_CHANGED_METHOD_LEGACY,
  LOG_MESSAGE_METHOD,
  OPEN_LINK_METHOD,
  OPEN_LINK_METHOD_LEGACY,
  REQUEST_DISPLAY_MODE_METHOD,
  REQUEST_DISPLAY_MODE_METHOD_LEGACY,
  RESOURCES_READ_METHOD,
  SIZE_CHANGED_METHOD,
  UI_MESSAGE_METHOD,
  UPDATE_MODEL_CONTEXT_METHOD,
} from "./mcp-app-protocol";
import type {
  McpHostCallToolParams,
  McpHostCapabilities,
  McpHostContainerDimensions,
  McpHostContext,
  McpHostMessageResult,
  McpHostModelContextResult,
  McpHostOpenLinkParams,
  McpHostReadResourceResult,
  McpHostRequestDisplayModeParams,
  McpHostRequestDisplayModeResult,
  McpHostSendMessageParams,
  McpHostToolResult,
  McpUiDisplayMode,
  McpHostUpdateModelContextParams,
} from "./mcp-app-types";

export * from "./mcp-app-protocol";
export type * from "./mcp-app-types";

export interface McpHostBridgeState {
  isConnected: boolean;
  hostContext: McpHostContext | null;
  hostCapabilities: McpHostCapabilities | null;
}

export interface McpHostBridge {
  callTool: (
    name: McpHostCallToolParams["name"],
    args?: McpHostCallToolParams["arguments"]
  ) => Promise<McpHostToolResult>;
  requestDisplayMode: (
    mode: McpUiDisplayMode
  ) => Promise<McpHostRequestDisplayModeResult>;
  openLink: (url: McpHostOpenLinkParams["url"]) => Promise<void>;
  readResource: (uri: string) => Promise<McpHostReadResourceResult>;
  sendMessage: (params: McpHostSendMessageParams) => Promise<McpHostMessageResult>;
  updateModelContext: (
    params: McpHostUpdateModelContextParams
  ) => Promise<McpHostModelContextResult>;
  logMessage: (params: McpHostSendMessageParams) => Promise<void>;
  notifySizeChanged: (
    params: McpHostContainerDimensions
  ) => Promise<void>;
  getState: () => McpHostBridgeState;
  getHostContext: () => McpHostContext | null;
  getHostCapabilities: () => McpHostCapabilities | null;
  isConnected: () => boolean;
  subscribe: (listener: (state: McpHostBridgeState) => void) => () => void;
  dispose: () => void;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface MessageEventLike {
  source: unknown;
  data: unknown;
}

interface MessageTargetLike {
  postMessage: (message: unknown, targetOrigin: string) => void;
}

interface WindowLike extends MessageTargetLike {
  parent: MessageTargetLike;
  open?: (url: string, target?: string, features?: string) => unknown;
  addEventListener: (
    type: "message",
    listener: (event: MessageEventLike) => void
  ) => void;
  removeEventListener: (
    type: "message",
    listener: (event: MessageEventLike) => void
  ) => void;
}

export interface CreateMcpHostBridgeOptions {
  targetWindow?: WindowLike;
  requestTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

function getDefaultWindow(): WindowLike | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window as unknown as WindowLike;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function mergeHostContext(
  current: McpHostContext | null,
  incoming: McpHostContext
): McpHostContext {
  const merged: McpHostContext = {
    ...(current ?? {}),
    ...incoming,
  };

  if (current?.safeAreaInsets || incoming.safeAreaInsets) {
    merged.safeAreaInsets = {
      ...(current?.safeAreaInsets ?? {}),
      ...(incoming.safeAreaInsets ?? {}),
    };
  }

  if (current?.containerDimensions || incoming.containerDimensions) {
    merged.containerDimensions = {
      ...(current?.containerDimensions ?? {}),
      ...(incoming.containerDimensions ?? {}),
    };
  }

  if (current?.styles || incoming.styles) {
    merged.styles = {
      ...(current?.styles ?? {}),
      ...(incoming.styles ?? {}),
      variables:
        current?.styles?.variables || incoming.styles?.variables
          ? {
              ...(current?.styles?.variables ?? {}),
              ...(incoming.styles?.variables ?? {}),
            }
          : undefined,
      css:
        current?.styles?.css || incoming.styles?.css
          ? {
              ...(current?.styles?.css ?? {}),
              ...(incoming.styles?.css ?? {}),
            }
          : undefined,
    };
  }

  return merged;
}

export function createMcpHostBridge(
  options: CreateMcpHostBridgeOptions = {}
): McpHostBridge {
  const targetWindow = options.targetWindow ?? getDefaultWindow();
  const requestTimeoutMs = options.requestTimeoutMs ?? 15_000;
  const connectionTimeoutMs = options.connectionTimeoutMs ?? 2_000;

  let nextId = 100;
  let disposed = false;
  let hasObservedHostTraffic = false;
  let state: McpHostBridgeState = {
    isConnected: !!targetWindow && targetWindow.parent !== targetWindow,
    hostContext: null,
    hostCapabilities: null,
  };

  const listeners = new Set<(state: McpHostBridgeState) => void>();
  const pending = new Map<number, PendingRequest>();

  const emit = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const setState = (nextState: McpHostBridgeState) => {
    if (
      nextState.isConnected === state.isConnected &&
      nextState.hostContext === state.hostContext &&
      nextState.hostCapabilities === state.hostCapabilities
    ) {
      return;
    }
    state = nextState;
    emit();
  };

  const rejectPending = (message: string) => {
    for (const [id, request] of pending.entries()) {
      clearTimeout(request.timeoutId);
      request.reject(new Error(message));
      pending.delete(id);
    }
  };

  const applyHostUpdate = (incoming: {
    hostContext?: McpHostContext;
    hostCapabilities?: McpHostCapabilities;
  }) => {
    const nextContext = incoming.hostContext
      ? mergeHostContext(state.hostContext, incoming.hostContext)
      : state.hostContext;
    const nextCapabilities = incoming.hostCapabilities
      ? {
          ...(state.hostCapabilities ?? {}),
          ...incoming.hostCapabilities,
        }
      : state.hostCapabilities;

    setState({
      isConnected: true,
      hostContext: nextContext,
      hostCapabilities: nextCapabilities,
    });
  };

  const handleMessage = (event: MessageEventLike) => {
    if (!targetWindow || event.source !== targetWindow.parent) return;
    if (!isRecord(event.data)) return;

    hasObservedHostTraffic = true;
    if (!state.isConnected) {
      setState({ ...state, isConnected: true });
    }

    const data = event.data;

    if ("id" in data && data.id != null && typeof data.id === "number") {
      const request = pending.get(data.id);
      if (request) {
        clearTimeout(request.timeoutId);
        pending.delete(data.id);
        if (isRecord(data.error)) {
          request.reject(
            new Error(
              typeof data.error.message === "string"
                ? data.error.message
                : "MCP request failed"
            )
          );
        } else {
          request.resolve(data.result);
        }
      }
    }

    if (data.id === 1 && isRecord(data.result)) {
      applyHostUpdate({
        hostContext: isRecord(data.result.hostContext)
          ? (data.result.hostContext as McpHostContext)
          : undefined,
        hostCapabilities: isRecord(data.result.hostCapabilities)
          ? (data.result.hostCapabilities as McpHostCapabilities)
          : undefined,
      });
    }

    if (
      data.method === HOST_CONTEXT_CHANGED_METHOD &&
      isRecord(data.params)
    ) {
      applyHostUpdate({
        hostContext: data.params as McpHostContext,
      });
    }

    if (
      data.method === HOST_CONTEXT_CHANGED_METHOD_LEGACY &&
      isRecord(data.params) &&
      isRecord(data.params.hostContext)
    ) {
      applyHostUpdate({
        hostContext: data.params.hostContext as McpHostContext,
      });
    }
  };

  if (targetWindow) {
    targetWindow.addEventListener("message", handleMessage);

    if (targetWindow.parent !== targetWindow) {
      setTimeout(() => {
        if (disposed || hasObservedHostTraffic || state.hostContext) return;
        setState({ ...state, isConnected: false });
      }, connectionTimeoutMs);
    }
  }

  const ensureWindow = (): WindowLike => {
    if (disposed) {
      throw new Error("MCP host bridge has been disposed");
    }
    if (!targetWindow) {
      throw new Error("MCP host bridge requires a browser window");
    }
    return targetWindow;
  };

  const sendNotification = (method: string, params: unknown) => {
    const activeWindow = ensureWindow();
    activeWindow.parent.postMessage(
      {
        jsonrpc: "2.0",
        method,
        params,
      },
      "*"
    );
  };

  const sendRequest = (
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<unknown> => {
    const activeWindow = ensureWindow();

    return new Promise((resolve, reject) => {
      const id = nextId++;
      const timeoutId = setTimeout(() => {
        if (!pending.has(id)) return;
        pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, requestTimeoutMs);

      pending.set(id, { resolve, reject, timeoutId });

      activeWindow.parent.postMessage(
        {
          jsonrpc: "2.0",
          id,
          method,
          params,
        },
        "*"
      );
    });
  };

  const sendRequestWithFallback = async (
    methods: string[],
    params: Record<string, unknown>
  ) => {
    let lastError: unknown;

    for (const method of methods) {
      try {
        return await sendRequest(method, params);
      } catch (error) {
        lastError = error;
        const message = toErrorMessage(error, "MCP request failed");
        if (!/method not found|unknown method/i.test(message)) {
          throw error;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("MCP request failed");
  };

  const fallbackOpen = async (url: string) => {
    if (targetWindow?.open) {
      targetWindow.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    throw new Error("Unable to open link without a browser window");
  };

  return {
    callTool(name, args) {
      return sendRequest("tools/call", {
        name,
        arguments: args ?? {},
      }) as Promise<McpHostToolResult>;
    },

    requestDisplayMode(mode) {
      return sendRequestWithFallback(
        [REQUEST_DISPLAY_MODE_METHOD, REQUEST_DISPLAY_MODE_METHOD_LEGACY],
        { mode }
      ) as Promise<McpHostRequestDisplayModeResult>;
    },

    async openLink(url) {
      try {
        await sendRequestWithFallback(
          [OPEN_LINK_METHOD, OPEN_LINK_METHOD_LEGACY],
          { url }
        );
      } catch (error) {
        const canFallback = !state.isConnected || !targetWindow;
        if (canFallback) {
          await fallbackOpen(url);
          return;
        }
        throw new Error(toErrorMessage(error, "Failed to open link"));
      }
    },

    readResource(uri) {
      return sendRequest(RESOURCES_READ_METHOD, {
        uri,
      }) as Promise<McpHostReadResourceResult>;
    },

    sendMessage(params) {
      return sendRequest(UI_MESSAGE_METHOD, params) as Promise<McpHostMessageResult>;
    },

    updateModelContext(params) {
      return sendRequest(
        UPDATE_MODEL_CONTEXT_METHOD,
        params
      ) as Promise<McpHostModelContextResult>;
    },

    async logMessage(params) {
      sendNotification(LOG_MESSAGE_METHOD, params);
    },

    async notifySizeChanged(params) {
      sendNotification(SIZE_CHANGED_METHOD, params);
    },

    getState() {
      return state;
    },

    getHostContext() {
      return state.hostContext;
    },

    getHostCapabilities() {
      return state.hostCapabilities;
    },

    isConnected() {
      return state.isConnected;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      if (targetWindow) {
        targetWindow.removeEventListener("message", handleMessage);
      }
      rejectPending("MCP host bridge has been disposed");
      listeners.clear();
    },
  };
}
