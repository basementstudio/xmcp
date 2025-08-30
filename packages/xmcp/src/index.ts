import dotenv from "dotenv";
export { type Middleware } from "./types/middleware";
dotenv.config();

export type {
  ToolMetadata,
  ToolSchema,
  ToolExtraArguments,
  InferSchema,
} from "./types/tool";
export type { PromptMetadata } from "./types/prompt";

export type { XmcpConfigOuputSchema as XmcpConfig } from "./compiler/config";
export type { OAuthConfigOptions } from "./auth/oauth";
import "./types/declarations";
export { apiKeyAuthMiddleware } from "./auth/api-key";
export { jwtAuthMiddleware } from "./auth/jwt";

export { createContext } from "./utils/context";
