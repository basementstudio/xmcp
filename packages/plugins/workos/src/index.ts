// Main provider export
export { workosProvider } from "./provider.js";

// Type exports
export type {
  WorkOSConfig,
  WorkOSSession,
  WorkOSJWTClaims,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";

// Session helpers
export {
  getWorkOSSession,
  getWorkOSSessionOrNull,
  getWorkOSUser,
} from "./session.js";

// WorkOS SDK client access
export { getWorkOSClient } from "./client.js";

// Context exports (for advanced use cases)
export {
  workosContext,
  getWorkOSContext,
  setWorkOSContext,
  workosContextProvider,
} from "./context.js";
