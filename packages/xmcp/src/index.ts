import dotenv from "dotenv";
export type {
  Middleware,
  WebMiddleware,
  WebMiddlewareContext,
} from "./types/middleware";
dotenv.config();

export type {
  ToolMetadata,
  ToolSchema,
  ToolOutputSchema,
  ToolExtraArguments,
  InferSchema,
  ElicitResult,
} from "./types/tool";
export type { McpClientInfo } from "./types/client-info";
export type { PromptMetadata } from "./types/prompt";
export type { ResourceMetadata } from "./types/resource";
export type { UIMetadata } from "./types/ui-meta";

export type { XmcpConfigInputSchema as XmcpConfig } from "./compiler/config";
import "./types/declarations";
export { apiKeyAuthMiddleware } from "./auth/api-key";
export { jwtAuthMiddleware } from "./auth/jwt";

export { createContext } from "./utils/context";

export { completable } from "@modelcontextprotocol/sdk/server/completable";
export { UrlElicitationRequiredError } from "@modelcontextprotocol/sdk/types";

export {
  createHTTPClient,
  createSTDIOClient,
  listSTDIOClientTools,
  callSTDIOClientTool,
  disconnectSTDIOClient,
} from "./client";
export type {
  HttpClient,
  StdioClient,
  StdioIOStrategy,
  ClientConnectionEntry,
  ClientConnections,
  ClientDefinition,
  HttpClientConfig,
  StdioClientConfig,
} from "./client/types";
export type { StdioClientConnection, StdioClientOptions } from "./client";
export type {
  CustomHeaders,
  CustomHeader,
  StaticHeader,
  EnvHeader,
} from "./client/headers";
export { isEnvHeader, headersToRecord } from "./client/headers";

export { extractToolNamesFromRequest } from "./runtime/utils/request-tool-names";
export { createMcpHostBridge } from "./runtime/utils/mcp-host-bridge";
export type {
  McpHostBridge,
  McpHostBridgeState,
  CreateMcpHostBridgeOptions,
} from "./runtime/utils/mcp-host-bridge";
export type {
  McpHostCallToolParams,
  McpHostContext,
  McpHostCapabilities,
  McpHostContainerDimensions,
  McpHostOpenLinkParams,
  McpHostReadResourceResult,
  McpHostRequestDisplayModeParams,
  McpHostRequestDisplayModeResult,
  McpHostSendMessageParams,
  McpHostMessageResult,
  McpHostModelContextResult,
  McpHostToolContentItem,
  McpHostToolResult,
  McpUiDisplayMode,
  McpHostUpdateModelContextParams,
} from "./runtime/utils/mcp-app-types";
export {
  MCP_APPS_PROTOCOL_VERSION,
  INITIALIZE_METHOD,
  INITIALIZED_METHOD,
  REQUEST_DISPLAY_MODE_METHOD,
  OPEN_LINK_METHOD,
  UPDATE_MODEL_CONTEXT_METHOD,
  UI_MESSAGE_METHOD,
  LOG_MESSAGE_METHOD,
  RESOURCES_READ_METHOD,
  HOST_CONTEXT_CHANGED_METHOD,
  SIZE_CHANGED_METHOD,
} from "./runtime/utils/mcp-app-protocol";
