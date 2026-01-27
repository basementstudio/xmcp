/**
 * JWT verification module for Cloudflare Workers.
 * Uses the jose library which is compatible with Web Crypto API.
 *
 * Note: jose is dynamically imported to support optional installation.
 * TypeScript types are defined inline to avoid compile-time dependency.
 */

// Cached jose module (loaded dynamically)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let joseModule: any = null;

/**
 * Options for JWT verification
 */
export interface JWTVerifyOptions {
  /**
   * Expected issuer (iss claim)
   * Example: "https://your-domain.auth0.com/"
   */
  issuer: string;

  /**
   * Expected audience (aud claim)
   * Example: "https://your-api.com"
   */
  audience: string;

  /**
   * Custom JWKS URI (optional)
   * If not provided, derived from issuer: {issuer}.well-known/jwks.json
   */
  jwksUri?: string;
}

/**
 * JWT payload with standard and common custom claims
 */
export interface JWTPayload {
  /** Issuer */
  iss?: string;
  /** Subject (user ID) */
  sub?: string;
  /** Audience */
  aud?: string | string[];
  /** Expiration time (Unix timestamp) */
  exp?: number;
  /** Not before (Unix timestamp) */
  nbf?: number;
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** JWT ID */
  jti?: string;
  /** Authorized party (client ID in OAuth) */
  azp?: string;
  /** Client ID (alternative to azp) */
  client_id?: string;
  /** Scopes (space-separated string) */
  scope?: string;
  /** Email claim */
  email?: string;
  /** Name claim */
  name?: string;
  /** Additional claims */
  [key: string]: unknown;
}

/**
 * Error thrown when jose library is not installed
 */
export class JoseNotInstalledError extends Error {
  constructor() {
    super(
      'The "jose" package is required for OAuth/JWT authentication. ' +
        "Please install it: npm install jose"
    );
    this.name = "JoseNotInstalledError";
  }
}

/**
 * Error thrown when JWT verification fails
 */
export class JWTVerificationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_TOKEN"
      | "EXPIRED_TOKEN"
      | "INVALID_SIGNATURE"
      | "INVALID_ISSUER"
      | "INVALID_AUDIENCE"
      | "JWKS_ERROR"
  ) {
    super(message);
    this.name = "JWTVerificationError";
  }
}

/**
 * Load the jose library dynamically.
 * This allows the library to be optional.
 * Uses a variable to prevent TypeScript from trying to resolve at compile time.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadJose(): Promise<any> {
  if (joseModule) {
    return joseModule;
  }

  try {
    // Use variable to prevent compile-time module resolution
    const moduleName = "jose";
    joseModule = await import(/* webpackIgnore: true */ moduleName);
    return joseModule;
  } catch {
    throw new JoseNotInstalledError();
  }
}

// Cache for JWKS key sets to avoid repeated fetches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jwksCache = new Map<string, { keySet: any; createdAt: number }>();

// Cache TTL: 1 hour (keys don't change frequently)
const JWKS_CACHE_TTL = 60 * 60 * 1000;

/**
 * Get or create a cached JWKS key set
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getJWKS(jwksUri: string, jose: any): Promise<any> {
  const cached = jwksCache.get(jwksUri);
  const now = Date.now();

  if (cached && now - cached.createdAt < JWKS_CACHE_TTL) {
    return cached.keySet;
  }

  const keySet = jose.createRemoteJWKSet(new URL(jwksUri));
  jwksCache.set(jwksUri, { keySet, createdAt: now });

  return keySet;
}

/**
 * Verify a JWT token using JWKS from the issuer.
 * Works in Cloudflare Workers (uses Web Crypto API).
 *
 * @param token - The JWT token to verify
 * @param options - Verification options
 * @returns The verified JWT payload
 * @throws JoseNotInstalledError if jose is not installed
 * @throws JWTVerificationError if verification fails
 */
export async function verifyJWT(
  token: string,
  options: JWTVerifyOptions
): Promise<JWTPayload> {
  const jose = await loadJose();

  // Derive JWKS URI from issuer if not provided
  const jwksUri =
    options.jwksUri ||
    `${options.issuer.replace(/\/$/, "")}/.well-known/jwks.json`;

  try {
    const JWKS = await getJWKS(jwksUri, jose);

    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: options.issuer,
      audience: options.audience,
    });

    return payload as JWTPayload;
  } catch (error) {
    // Handle specific jose errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Cast to access potential 'code' property from jose errors
      const errorCode = (error as unknown as { code?: string }).code;

      if (
        message.includes("expired") ||
        error.name === "JWTExpired" ||
        errorCode === "ERR_JWT_EXPIRED"
      ) {
        throw new JWTVerificationError("Token has expired", "EXPIRED_TOKEN");
      }

      if (
        message.includes("signature") ||
        error.name === "JWSSignatureVerificationFailed" ||
        errorCode === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED"
      ) {
        throw new JWTVerificationError(
          "Invalid token signature",
          "INVALID_SIGNATURE"
        );
      }

      if (
        message.includes("issuer") ||
        errorCode === "ERR_JWT_CLAIM_VALIDATION_FAILED"
      ) {
        if (message.includes("iss")) {
          throw new JWTVerificationError("Invalid issuer", "INVALID_ISSUER");
        }
        if (message.includes("aud")) {
          throw new JWTVerificationError(
            "Invalid audience",
            "INVALID_AUDIENCE"
          );
        }
      }

      if (message.includes("jwks") || message.includes("fetch")) {
        throw new JWTVerificationError(
          `Failed to fetch JWKS: ${error.message}`,
          "JWKS_ERROR"
        );
      }
    }

    // Generic invalid token error
    throw new JWTVerificationError(
      `Token verification failed: ${error instanceof Error ? error.message : String(error)}`,
      "INVALID_TOKEN"
    );
  }
}

/**
 * Clear the JWKS cache.
 * Useful for testing or when keys are rotated.
 */
export function clearJWKSCache(): void {
  jwksCache.clear();
}
