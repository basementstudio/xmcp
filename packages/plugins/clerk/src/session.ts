import { getSessionContext } from "./context.js";
import { getClient } from "./client.js";
import type { Session } from "./types.js";
import type { User } from "@clerk/express";

export function getSession(): Session {
  const context = getSessionContext();

  if (!context.session) {
    throw new Error(
      "[Clerk] Session not initialized. " +
        "Make sure clerkProvider() is configured in your middleware."
    );
  }

  return context.session;
}

export async function getUser(): Promise<User> {
  const session = getSession();
  const client = getClient();
  return await client.users.getUser(session.userId);
}
