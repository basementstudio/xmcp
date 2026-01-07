import { getClerkContextSession } from "./context.js";
import { getClerkClient } from "./client.js";
import type { ClerkSession } from "./types.js";
import type { User } from "@clerk/express";

export function getClerkSession(): ClerkSession {
  const context = getClerkContextSession();

  if (!context.session) {
    throw new Error(
      "getClerkSession() called but no session exists. " +
        "Ensure this is called within a protected route that passed authentication."
    );
  }

  return context.session;
}

export async function getClerkUser(): Promise<User> {
  const session = getClerkSession();
  const clerk = getClerkClient();
  return await clerk.users.getUser(session.userId);
}
