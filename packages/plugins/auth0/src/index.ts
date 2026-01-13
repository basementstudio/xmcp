export {
  auth0Provider,
  requireScopes,
  InsufficientScopeError,
  InvalidTokenError,
} from "./provider.js";

export { getAuthInfo, getUser } from "./session.js";

export { getAuth0Client, getManagementClient } from "./client.js";

export type {
  Auth0Config,
  Auth0ManagementConfig,
  Auth0User,
  AuthInfo,
  AuthInfoExtra,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";

export type { ApiClient } from "@auth0/auth0-api-js";
export type { ManagementClient } from "auth0";
