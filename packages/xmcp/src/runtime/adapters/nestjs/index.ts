export { XmcpModule } from "./xmcp.module";
export { XmcpCoreModule } from "./xmcp-core.module";
export { XmcpService } from "./xmcp.service";
export { XmcpController } from "./xmcp.controller";

// Auth exports
export {
  XmcpAuthGuard,
  XmcpAuth,
  Auth,
  McpAuth,
  AUTH_CONFIG_KEY,
  ResourceMetadataController,
  AUTHORIZATION_SERVERS,
} from "./auth";
export type {
  AuthConfig,
  AuthInfo,
  VerifyToken,
  OAuthProtectedResourceMetadata,
} from "./auth";
