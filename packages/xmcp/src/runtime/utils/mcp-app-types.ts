export type McpUiDisplayMode = "inline" | "fullscreen" | "pip";

export interface McpHostCallToolParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface McpHostOpenLinkParams {
  url: string;
}

export interface McpHostRequestDisplayModeParams {
  mode: McpUiDisplayMode;
}

export interface McpHostRequestDisplayModeResult {
  mode: McpUiDisplayMode | string;
}

export interface McpHostSendMessageParams {
  role?: string;
  content: unknown;
  [key: string]: unknown;
}

export interface McpHostUpdateModelContextParams {
  content?: unknown;
  role?: string;
  [key: string]: unknown;
}

export interface McpHostToolContentItem {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface McpHostToolResult {
  content?: McpHostToolContentItem[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
}

export interface McpHostResourceContentItem {
  uri?: string;
  mimeType?: string;
  text?: string;
  blob?: string;
  [key: string]: unknown;
}

export interface McpHostReadResourceResult {
  contents?: McpHostResourceContentItem[];
  [key: string]: unknown;
}

export interface McpHostMessageResult {
  role?: string;
  content?: unknown;
  [key: string]: unknown;
}

export interface McpHostModelContextResult {
  ok?: boolean;
  [key: string]: unknown;
}

export interface McpHostContainerDimensions {
  width?: number;
  height?: number;
}

export interface McpHostStyleContext {
  variables?: Record<string, string>;
  css?: {
    fonts?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface McpHostContext {
  theme?: string;
  displayMode?: McpUiDisplayMode | string;
  locale?: string;
  timeZone?: string;
  platform?: string;
  availableDisplayModes?: McpUiDisplayMode[];
  containerDimensions?: McpHostContainerDimensions;
  safeAreaInsets?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  toolInfo?: Record<string, unknown>;
  deviceCapabilities?: Record<string, unknown>;
  styles?: McpHostStyleContext;
  [key: string]: unknown;
}

export interface McpHostCapabilities {
  serverTools?: { listChanged?: boolean; call?: boolean };
  serverResources?: { listChanged?: boolean; read?: boolean };
  openLinks?: boolean;
  updateModelContext?: boolean | string[];
  message?: boolean;
  logging?: boolean;
  downloadFile?: boolean;
  sandbox?: Record<string, unknown>;
  [key: string]: unknown;
}
