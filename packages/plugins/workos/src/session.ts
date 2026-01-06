import { getWorkOSSessionContext, getWorkOSClientContext } from "./context.js";
import type { WorkOSSession } from "./types.js";
import type { User } from "@workos-inc/node";

export function getWorkOSSession(): WorkOSSession {
  const context = getWorkOSSessionContext();

  if (!context.session) {
    throw new Error(
      "getWorkOSSession() called but no session exists. " +
        "Ensure this is called within a protected route that passed authentication."
    );
  }

  return context.session;
}

export async function getWorkOSUser(): Promise<User> {
  const session = getWorkOSSession();
  const { workos } = getWorkOSClientContext();
  return await workos.userManagement.getUser(session.userId);
}
