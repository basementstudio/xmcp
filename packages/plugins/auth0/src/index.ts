export {
  auth0Provider,
  requireScopes,
  InsufficientScopeError,
  InvalidTokenError,
} from "./provider.js";

export type { AuthToolContext } from "./provider.js";

export { getAuthInfo } from "./session.js";

export type {
  Auth0Config,
  AuthInfo,
  AuthInfoExtra,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";
