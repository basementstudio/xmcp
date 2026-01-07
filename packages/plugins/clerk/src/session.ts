import { getContextSession } from "./context.js";
import { getClient } from "./client.js";
import type { Session } from "./types.js";
import type { User } from "@clerk/express";

export function getSession(): Session {
  const context = getContextSession();

  if (!context.session) {
    throw new Error(
      "getSession() called but no session exists. " +
        "Ensure this is called within a protected route that passed authentication."
    );
  }

  return context.session;
}

export async function getUser(): Promise<User> {
  const session = getSession();
  const client = getClient();
  return await client.users.getUser(session.userId);
}
