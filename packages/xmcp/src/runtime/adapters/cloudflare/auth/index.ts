/**
 * Auth module re-exports for Cloudflare Workers adapter.
 */

// Types
export type {
  CloudflareOAuthConfig,
  OAuthAuthInfo,
  OAuthProtectedResourceMetadata,
} from "./types";

// JWT verification
export { verifyJWT, JWTVerificationError } from "./jwt";
export type { JWTVerifyOptions, JWTPayload } from "./jwt";

// Config
export { OAuthConfigSchema, getOAuthConfig } from "./config";

// Responses
export {
  createUnauthorizedResponse,
  createForbiddenResponse,
} from "./responses";

// Validators
export { validateApiKey } from "./api-key-validator";
export { validateOAuth } from "./oauth-validator";

// Orchestrator
export { runBuiltinAuth, runMiddleware } from "./orchestrator";
