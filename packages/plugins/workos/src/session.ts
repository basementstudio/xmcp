import { getWorkOSContext } from "./context.js";
import { getWorkOSClient } from "./client.js";
import type { WorkOSSession } from "./types.js";
import type { User } from "@workos-inc/node";

/**
 * Get the current WorkOS session from context
 * Must be called within a request that has passed through the WorkOS middleware
 *
 * @throws Error if called outside of WorkOS context or if no session exists
 * @returns The current WorkOS session
 */
export function getWorkOSSession(): WorkOSSession {
  const context = getWorkOSContext();

  if (!context.session) {
    throw new Error(
      "getWorkOSSession() called but no session exists. " +
        "Ensure this is called within a protected route that passed authentication."
    );
  }

  return context.session;
}

/**
 * Get the current WorkOS session or null if not authenticated
 * Safe version that doesn't throw
 *
 * @returns The current WorkOS session or null
 */
export function getWorkOSSessionOrNull(): WorkOSSession | null {
  try {
    const context = getWorkOSContext();
    return context.session;
  } catch {
    return null;
  }
}

/**
 * Get full user data from WorkOS API
 * Uses the WorkOS SDK to fetch complete user information
 *
 * @returns The full WorkOS user object
 */
export async function getWorkOSUser(): Promise<User> {
  const session = getWorkOSSession();
  const workos = getWorkOSClient();
  return await workos.userManagement.getUser(session.userId);
}
