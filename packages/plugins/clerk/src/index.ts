export { clerkProvider } from "./provider.js";

export type {
  config,
  Session,
  JWTClaims,
  SessionContext,
  ClientContext,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
  TokenVerifyResult,
  VerifyResponse,
} from "./types.js";

export { getSession, getUser } from "./session.js";

export { getClient } from "./client.js";

export {
  contextSession,
  getContextSession,
  setContextSession,
  contextProviderSession,
  contextClient,
  getContextClient,
  setContextClient,
  contextProviderClient,
} from "./context.js";

