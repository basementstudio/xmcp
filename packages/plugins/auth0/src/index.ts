export { auth0Provider } from "./provider.js";

export { getAuthInfo } from "./session.js";

export { getClient, getManagement } from "./client.js";

export type {
  Config,
  ManagementConfig,
  AuthInfo,
  UserClaims,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";

export type { ApiClient } from "@auth0/auth0-api-js";
export type { ManagementClient } from "auth0";
