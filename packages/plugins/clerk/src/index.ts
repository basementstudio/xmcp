export { clerkProvider } from "./provider.js";

export type {
  ClerkConfig,
  ClerkSession,
  ClerkJWTClaims,
  ClerkSessionContext,
  ClerkClientContext,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
  TokenVerifyResult,
  ClerkVerifyResponse,
} from "./types.js";

export { getClerkSession, getClerkUser } from "./session.js";

export { getClerkClient } from "./client.js";

export {
  clerkContextSession,
  getClerkContextSession,
  setClerkContextSession,
  clerkContextProviderSession,
  clerkContextClient,
  getClerkContextClient,
  setClerkContextClient,
  clerkContextProviderClient,
} from "./context.js";

