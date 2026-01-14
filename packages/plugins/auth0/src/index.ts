export { auth0Provider } from "./provider.js";

export { getAuthInfo, getUser } from "./session.js";

export { getAuth0Client, getManagementClient } from "./client.js";

export type {
  Auth0Config,
  Auth0ManagementConfig,
  Auth0User,
  AuthInfo,
  UserClaims,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";

export type { ApiClient } from "@auth0/auth0-api-js";
export type { ManagementClient } from "auth0";
