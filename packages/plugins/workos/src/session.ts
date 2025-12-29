import type { WorkOSSession, WorkOSUser } from "./types.js";
import { getWorkOSContext } from "./context.js";
import { extractBearerToken } from "./utils.js";

/**
 * Decode a JWT payload without verification (for extracting claims)
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// Simple in-memory cache for user data
const userCache = new Map<string, { user: WorkOSUser; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch user details from WorkOS User Management API
 */
async function fetchUserFromWorkOS(
  userId: string,
  apiKey: string
): Promise<WorkOSUser | null> {
  // Check cache first
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  try {
    const response = await fetch(
      `https://api.workos.com/user_management/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const userData = (await response.json()) as {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      profile_picture_url: string | null;
      email_verified: boolean;
      created_at: string;
      updated_at: string;
    };

    const user: WorkOSUser = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      profilePictureUrl: userData.profile_picture_url,
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };

    // Cache the user
    userCache.set(userId, { user, expiresAt: Date.now() + CACHE_TTL });

    return user;
  } catch {
    return null;
  }
}

/**
 * Get the current WorkOS session from the authenticated request.
 *
 * This function retrieves the user information from the WorkOS access token
 * that was validated by the middleware. It uses the context set by workosProvider.
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

  // Get the payload (either from context or decode it)
  const payload = context.payload ?? decodeJwtPayload(token);

  if (!payload) {
    throw new Error("Invalid access token format");
  }

  const userId = payload.sub as string;
  
  if (!userId) {
    throw new Error("Access token missing user ID (sub claim)");
  }

  // Fetch user details from WorkOS API
  const user = await fetchUserFromWorkOS(userId, context.config.apiKey);

  if (!user) {
    // Fallback to minimal user info from token
    const session: WorkOSSession = {
      accessToken: token,
      user: {
        id: userId,
        email: "",
        firstName: null,
        lastName: null,
        profilePictureUrl: null,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      organizationId: payload.org_id as string | undefined,
    };
    return session;
  }

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
}
