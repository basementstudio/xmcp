import { getSessionContext, getClientContext } from "./context.js";
import type { Session } from "./types.js";
import type { User } from "@workos-inc/node";

export function getSession(): Session {
  const context = getSessionContext();

  if (!context.session) {
    throw new Error(
      "[WorkOS] Session not initialized. " +
        "Ensure this is called within a protected route that passed authentication."
    );
  }

  return context.session;
}

export async function getUser(): Promise<User> {
  const session = getSession();
  const { client } = getClientContext();
  return await client.userManagement.getUser(session.userId);
}
