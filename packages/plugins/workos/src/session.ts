import type { User } from "@workos-inc/node";
import type { WorkOSSession } from "./types.js";
import { getWorkOSContext } from "./context.js";
import { extractBearerToken } from "./utils.js";

/**
 * Get the current WorkOS session from the authenticated request.
 *
 * This function retrieves the user information from the WorkOS access token
 * that was validated by the middleware. It uses the context set by workosProvider.
 *
 * Note: The token has already been verified by the middleware using JWKS,
 * including signature, issuer, audience, and expiration validation.
 *
 * @throws Error if called outside of a workosProvider context or no valid token
 * @returns The current WorkOS session with user information
 *
 * @example
 * ```ts
 * import { getWorkOSSession } from "@xmcp-dev/workos";
 *
 * export default async function myTool(args: { name: string }) {
 *   const session = await getWorkOSSession();
 *   return `Hello, ${session.user.email}!`;
 * }
 * ```
 */
export async function getWorkOSSession(): Promise<WorkOSSession> {
  const context = getWorkOSContext();

  if (!context) {
    throw new Error(
      "getWorkOSSession must be used within a workosProvider authenticated request"
    );
  }

  const headers = context.headers;

  if (!headers) {
    throw new Error(
      "No headers found in context. Ensure workosProvider middleware is configured."
    );
  }

  const authHeader = headers.authorization;
  const token = extractBearerToken(
    Array.isArray(authHeader) ? authHeader[0] : authHeader
  );

  if (!token) {
    throw new Error(
      "No authorization token found. Ensure the request includes a valid Bearer token."
    );
  }

  const payload = context.payload;

  if (!payload) {
    throw new Error(
      "No verified token payload in context. This request may not have been authenticated by the workosProvider middleware."
    );
  }

  const userId = payload.sub;

  if (!userId) {
    throw new Error("Access token missing user ID (sub claim)");
  }

  // Fetch user details using the WorkOS SDK (no cache - serverless compatible)
  try {
    // SDK returns User type directly
    const user = await context.config.client.userManagement.getUser(userId);

    const session: WorkOSSession = {
      accessToken: token,
      user,
      organizationId: payload.org_id as string | undefined,
      impersonator: payload.act
        ? {
            email: (payload.act as { sub: string; reason?: string }).sub,
            reason: (payload.act as { sub: string; reason?: string }).reason ?? null,
          }
        : undefined,
    };

    return session;
  } catch {
    // Fallback to minimal user info from token if SDK call fails
    const fallbackUser: User = {
      object: "user",
      id: userId,
      email: "",
      firstName: null,
      lastName: null,
      profilePictureUrl: null,
      emailVerified: false,
      lastSignInAt: null,
      locale: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      externalId: null,
      metadata: {},
    };

    const session: WorkOSSession = {
      accessToken: token,
      user: fallbackUser,
      organizationId: payload.org_id as string | undefined,
    };
    return session;
  }
}
